/**
 * @fileoverview Authentication hook and context provider for the Vertex Work Platform.
 * @module hooks/useAuth
 * 
 * @description
 * Provides authentication state management using Supabase Auth. This module handles:
 * - User authentication (sign in, sign up, sign out)
 * - Session management
 * - User profile and role management
 * - Clearance level checks for classified data access
 * 
 * @example
 * ```tsx
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // Use the hook in components
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 * ```
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ClassificationLevel, AppRole } from '@/types/jira';

/**
 * User profile information stored in the application.
 * 
 * @interface UserProfile
 * @property {string} id - Unique identifier matching the auth.users id
 * @property {string} email - User's email address
 * @property {string} display_name - User's display name shown in the UI
 * @property {string} [avatar_url] - URL to the user's avatar image
 * @property {string} [job_title] - User's job title
 * @property {string} [department] - User's department
 * @property {ClassificationLevel} [clearance_level] - User's security clearance level
 */
interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  clearance_level?: ClassificationLevel;
}

/**
 * Authentication context type providing auth state and methods.
 * 
 * @interface AuthContextType
 */
interface AuthContextType {
  /** The currently authenticated Supabase user, or null if not authenticated */
  user: User | null;
  /** The current Supabase session, or null if not authenticated */
  session: Session | null;
  /** The user's profile data from the profiles table */
  profile: UserProfile | null;
  /** Array of roles assigned to the current user */
  roles: AppRole[];
  /** The user's security clearance level for accessing classified data */
  clearanceLevel: ClassificationLevel;
  /** Whether the auth state is still being loaded */
  isLoading: boolean;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  /** Register a new user with email, password, and display name */
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Check if the user has a specific role */
  hasRole: (role: AppRole) => boolean;
  /** Check if the user has sufficient clearance for a classification level */
  hasClearance: (level: ClassificationLevel) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hierarchy of classification levels from lowest to highest sensitivity.
 * Used for clearance level comparisons.
 */
const CLEARANCE_HIERARCHY: ClassificationLevel[] = [
  'public',
  'restricted',
  'confidential',
  'export_controlled',
];

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  /** Child components that will have access to auth context */
  readonly children: ReactNode;
}

/**
 * Authentication provider component that wraps the application.
 * 
 * Provides authentication state and methods to all child components via React Context.
 * Handles automatic session recovery and auth state changes.
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes />
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetches user profile and role data from the database.
   * 
   * @param authUser - The authenticated Supabase user
   */
  const fetchUserData = async (authUser: User): Promise<void> => {
    // Try to fetch profile from database
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileData) {
      setProfile({
        id: profileData.id,
        email: profileData.email || authUser.email || '',
        display_name: profileData.display_name || authUser.email?.split('@')[0] || 'User',
        avatar_url: profileData.avatar_url,
        job_title: profileData.job_title,
        department: profileData.department,
        clearance_level: profileData.clearance_level || 'restricted',
      });
    } else {
      // Fallback to auth user metadata
      const displayName = authUser.user_metadata?.display_name || 
        authUser.email?.split('@')[0] || 
        'User';
      
      setProfile({
        id: authUser.id,
        email: authUser.email || '',
        display_name: displayName,
        avatar_url: authUser.user_metadata?.avatar_url,
        clearance_level: 'restricted',
      });
    }

    // Fetch user roles from database
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    if (rolesData && rolesData.length > 0) {
      setRoles(rolesData.map(r => r.role as AppRole));
    } else {
      // Default role if none assigned
      setRoles(['developer']);
    }
  };

  /**
   * Signs in a user with email and password.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Object containing error if sign in failed, null otherwise
   * 
   * @example
   * ```typescript
   * const { error } = await signIn('user@example.com', 'password123');
   * if (error) {
   *   console.error('Sign in failed:', error.message);
   * }
   * ```
   */
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  /**
   * Registers a new user with email, password, and display name.
   * 
   * @param email - User's email address
   * @param password - User's password (minimum 6 characters)
   * @param displayName - User's display name
   * @returns Object containing error if sign up failed, null otherwise
   * 
   * @example
   * ```typescript
   * const { error } = await signUp('user@example.com', 'password123', 'John Doe');
   * if (error) {
   *   console.error('Sign up failed:', error.message);
   * }
   * ```
   */
  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: Error | null }> => {
    const redirectUrl = `${globalThis.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  /**
   * Signs out the current user and clears all auth state.
   * 
   * @example
   * ```typescript
   * await signOut();
   * // User is now signed out, redirect to login page
   * ```
   */
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  /**
   * Checks if the current user has a specific role.
   * Admins are granted all roles automatically.
   * 
   * @param role - The role to check for
   * @returns True if user has the role or is an admin
   * 
   * @example
   * ```typescript
   * if (hasRole('admin')) {
   *   // Show admin-only features
   * }
   * ```
   */
  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || roles.includes('admin');
  };

  /**
   * Checks if the user has sufficient clearance to access a classification level.
   * Clearance follows a hierarchy: public < restricted < confidential < export_controlled.
   * 
   * @param level - The classification level to check access for
   * @returns True if user's clearance is equal to or higher than the required level
   * 
   * @example
   * ```typescript
   * if (hasClearance('confidential')) {
   *   // User can view confidential data
   * }
   * ```
   */
  const hasClearance = (level: ClassificationLevel): boolean => {
    const userLevel = profile?.clearance_level || 'public';
    const userIndex = CLEARANCE_HIERARCHY.indexOf(userLevel);
    const requiredIndex = CLEARANCE_HIERARCHY.indexOf(level);
    return userIndex >= requiredIndex;
  };

  const clearanceLevel: ClassificationLevel = profile?.clearance_level || 'public';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        clearanceLevel,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasClearance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and methods.
 * 
 * Must be used within an AuthProvider component.
 * 
 * @returns The authentication context containing user state and auth methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function UserGreeting() {
 *   const { user, isAuthenticated, profile } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <p>Please sign in</p>;
 *   }
 *   
 *   return <p>Hello, {profile?.display_name}!</p>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
