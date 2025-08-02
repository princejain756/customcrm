import { postgresService } from './service';
import { Profile } from './schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organisation_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organisation_id?: string;
}

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  private generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisation_id: user.organisation_id,
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  // Verify JWT token
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthUser;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<{ user: AuthUser; token: string } | null> {
    try {
      // Check if user already exists
      const existingProfile = await postgresService.getProfileByUserId(data.email);
      if (existingProfile) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create profile
      const profile: Profile = {
        id: data.email, // Using email as ID for simplicity
        name: data.name,
        organisation_id: data.organisation_id || null,
        role: 'sales_person',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await postgresService.createProfile(profile);

      // Create auth user object
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.id,
        name: profile.name,
        role: profile.role,
        organisation_id: profile.organisation_id || undefined,
      };

      // Generate token
      const token = this.generateToken(authUser);

      return { user: authUser, token };
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
    try {
      // Get user profile
      const profile = await postgresService.getProfileByUserId(credentials.email);
      if (!profile) {
        throw new Error('User not found');
      }

      // For now, we'll use a simple password check
      // In a real implementation, you'd store hashed passwords in the database
      if (credentials.password !== 'password123') { // Default password for demo
        throw new Error('Invalid password');
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.id,
        name: profile.name,
        role: profile.role,
        organisation_id: profile.organisation_id || undefined,
      };

      // Generate token
      const token = this.generateToken(authUser);

      return { user: authUser, token };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Get current user from token
  async getCurrentUser(token: string): Promise<AuthUser | null> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      // Verify user still exists in database
      const profile = await postgresService.getProfile(decoded.id);
      if (!profile || !profile.is_active) {
        return null;
      }

      return {
        id: profile.id,
        email: profile.id,
        name: profile.name,
        role: profile.role,
        organisation_id: profile.organisation_id || undefined,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | null> {
    try {
      return await postgresService.updateProfile(userId, data);
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  }

  // Logout (client-side only, server just validates token)
  logout(): void {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just rely on client-side token removal
  }
}

// Export singleton instance
export const authService = new AuthService(); 