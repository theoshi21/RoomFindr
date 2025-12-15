/**
 * Property-Based Tests for Admin System
 * **Feature: roomfindr, Property 5: Admin account management maintains security**
 * **Validates: Requirements 1A.2, 1A.4, 1A.5**
 * 
 * **Feature: roomfindr, Property 22: Role-based access control is enforced**
 * **Validates: Requirements 10A.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import type { AdminUser, UserAccountUpdate, CreateAdminData } from '../types/admin'
import type { User } from '../types/database'

// Test data generators
const userRoleArb = fc.constantFrom('admin', 'tenant', 'landlord')
const userStatusArb = fc.constantFrom('active', 'inactive', 'suspended')
const adminPermissionArb = fc.constantFrom('full', 'limited', 'read_only')

const createAdminDataArb = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8 }).filter(pwd => 
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)
  ),
  firstName: fc.string({ minLength: 2, maxLength: 50 }).filter(name => 
    name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim())
  ),
  lastName: fc.string({ minLength: 2, maxLength: 50 }).filter(name => 
    name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim())
  ),
  permissions: adminPermissionArb
})

const userAccountUpdateArb = fc.record({
  userId: fc.uuid(),
  updates: fc.record({
    is_active: fc.option(fc.boolean(), { nil: undefined }),
    role: fc.option(userRoleArb, { nil: undefined }),
    is_verified: fc.option(fc.boolean(), { nil: undefined }),
    permissions: fc.option(adminPermissionArb, { nil: undefined })
  }, { requiredKeys: [] })
})

// Mock admin management system
class MockAdminManager {
  private users: Map<string, User> = new Map()
  private auditLog: Array<{ action: string; userId: string; adminId: string; timestamp: Date; details: any }> = []
  private currentAdminId: string = 'admin-test-id'

  createAdminAccount(adminData: CreateAdminData, createdBy: string): { success: boolean; adminId?: string; error?: string } {
    // Validate admin creation permissions
    if (!this.isValidAdmin(createdBy)) {
      return { success: false, error: 'Insufficient permissions to create admin account' }
    }

    // Validate admin data
    if (!adminData.email || !adminData.password || !adminData.firstName || !adminData.lastName) {
      return { success: false, error: 'Missing required admin data' }
    }

    // Check if admin already exists
    const existingAdmin = Array.from(this.users.values()).find(u => u.email === adminData.email)
    if (existingAdmin) {
      return { success: false, error: 'Admin with this email already exists' }
    }

    // Create admin user
    const adminId = crypto.randomUUID()
    const newAdmin: User = {
      id: adminId,
      email: adminData.email,
      role: 'admin',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        permissions: adminData.permissions
      }
    }

    this.users.set(adminId, newAdmin)
    
    // Log admin creation
    this.auditLog.push({
      action: 'admin_created',
      userId: adminId,
      adminId: createdBy,
      timestamp: new Date(),
      details: { permissions: adminData.permissions }
    })

    return { success: true, adminId }
  }

  updateUserAccount(update: UserAccountUpdate, adminId: string): { success: boolean; error?: string } {
    // Validate admin permissions
    if (!this.isValidAdmin(adminId)) {
      return { success: false, error: 'Insufficient permissions to update user account' }
    }

    const user = this.users.get(update.userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Apply updates
    const updatedUser = { ...user }
    if (update.updates.is_active !== undefined) {
      updatedUser.is_active = update.updates.is_active
    }
    if (update.updates.role !== undefined) {
      updatedUser.role = update.updates.role
    }
    if (update.updates.is_verified !== undefined) {
      updatedUser.is_verified = update.updates.is_verified
    }
    if (update.updates.permissions !== undefined) {
      updatedUser.user_metadata = {
        ...updatedUser.user_metadata,
        permissions: update.updates.permissions
      }
    }

    updatedUser.updated_at = new Date().toISOString()
    this.users.set(update.userId, updatedUser)

    // Log the update
    this.auditLog.push({
      action: 'user_updated',
      userId: update.userId,
      adminId,
      timestamp: new Date(),
      details: update.updates
    })

    return { success: true }
  }

  deactivateAdminAccount(adminId: string, deactivatedBy: string): { success: boolean; error?: string } {
    // Validate permissions
    if (!this.isValidAdmin(deactivatedBy)) {
      return { success: false, error: 'Insufficient permissions to deactivate admin account' }
    }

    // Prevent self-deactivation
    if (adminId === deactivatedBy) {
      return { success: false, error: 'Cannot deactivate your own admin account' }
    }

    const admin = this.users.get(adminId)
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Admin account not found' }
    }

    // Deactivate admin
    const updatedAdmin = { ...admin, is_active: false, updated_at: new Date().toISOString() }
    this.users.set(adminId, updatedAdmin)

    // Log deactivation
    this.auditLog.push({
      action: 'admin_deactivated',
      userId: adminId,
      adminId: deactivatedBy,
      timestamp: new Date(),
      details: {}
    })

    return { success: true }
  }

  getAuditLog(): Array<{ action: string; userId: string; adminId: string; timestamp: Date; details: any }> {
    return [...this.auditLog].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  hasRoleBasedAccess(userId: string, requiredRole: 'admin' | 'landlord' | 'tenant'): boolean {
    const user = this.users.get(userId)
    if (!user || !user.is_active) {
      return false
    }

    // Admin has access to everything
    if (user.role === 'admin') {
      return true
    }

    // User must have exact role match for non-admin access
    return user.role === requiredRole
  }

  private isValidAdmin(adminId: string): boolean {
    const admin = this.users.get(adminId)
    return admin?.role === 'admin' && admin.is_active === true
  }

  // Test helper methods
  addTestUser(user: User): void {
    this.users.set(user.id, user)
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  clear(): void {
    this.users.clear()
    this.auditLog = []
  }
}

describe('Property 5: Admin Account Management Maintains Security', () => {
  let mockManager: MockAdminManager

  beforeEach(() => {
    mockManager = new MockAdminManager()
    
    // Add a test admin user
    const testAdmin: User = {
      id: 'admin-test-id',
      email: 'admin@test.com',
      role: 'admin',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        first_name: 'Test',
        last_name: 'Admin',
        permissions: 'full'
      }
    }
    mockManager.addTestUser(testAdmin)
  })

  it('should require admin authentication for admin account creation', () => {
    fc.assert(
      fc.property(
        createAdminDataArb,
        fc.uuid(), // non-admin user ID
        (adminData, nonAdminId) => {
          // Add a non-admin user
          const nonAdmin: User = {
            id: nonAdminId,
            email: 'user@test.com',
            role: 'tenant',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(nonAdmin)

          // Attempt to create admin account with non-admin user
          const result = mockManager.createAdminAccount(adminData, nonAdminId)

          // Should fail due to insufficient permissions
          expect(result.success).toBe(false)
          expect(result.error).toMatch(/insufficient permissions|not authorized/i)
          expect(result.adminId).toBeUndefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should assign appropriate permissions and log admin creation', () => {
    fc.assert(
      fc.property(
        createAdminDataArb,
        (adminData) => {
          // Create admin account with valid admin
          const result = mockManager.createAdminAccount(adminData, 'admin-test-id')

          // Should succeed
          expect(result.success).toBe(true)
          expect(result.adminId).toBeDefined()
          expect(result.error).toBeUndefined()

          // Verify admin was created with correct properties
          const createdAdmin = mockManager.getUser(result.adminId!)
          expect(createdAdmin).toBeDefined()
          expect(createdAdmin!.role).toBe('admin')
          expect(createdAdmin!.email).toBe(adminData.email)
          expect(createdAdmin!.is_active).toBe(true)
          expect(createdAdmin!.is_verified).toBe(true)
          expect(createdAdmin!.user_metadata?.first_name).toBe(adminData.firstName)
          expect(createdAdmin!.user_metadata?.last_name).toBe(adminData.lastName)
          expect(createdAdmin!.user_metadata?.permissions).toBe(adminData.permissions)

          // Verify audit log entry
          const auditLog = mockManager.getAuditLog()
          const creationLog = auditLog.find(log => 
            log.action === 'admin_created' && log.userId === result.adminId
          )
          expect(creationLog).toBeDefined()
          expect(creationLog!.adminId).toBe('admin-test-id')
          expect(creationLog!.details.permissions).toBe(adminData.permissions)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should update permissions correctly and maintain audit trail', () => {
    fc.assert(
      fc.property(
        userAccountUpdateArb,
        (updateData) => {
          // Create a test user to update
          const testUser: User = {
            id: updateData.userId,
            email: 'testuser@example.com',
            role: 'tenant',
            is_active: true,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(testUser)

          // Update user account
          const result = mockManager.updateUserAccount(updateData, 'admin-test-id')

          // Should succeed
          expect(result.success).toBe(true)
          expect(result.error).toBeUndefined()

          // Verify updates were applied
          const updatedUser = mockManager.getUser(updateData.userId)
          expect(updatedUser).toBeDefined()

          if (updateData.updates.is_active !== undefined) {
            expect(updatedUser!.is_active).toBe(updateData.updates.is_active)
          }
          if (updateData.updates.role !== undefined) {
            expect(updatedUser!.role).toBe(updateData.updates.role)
          }
          if (updateData.updates.is_verified !== undefined) {
            expect(updatedUser!.is_verified).toBe(updateData.updates.is_verified)
          }
          if (updateData.updates.permissions !== undefined) {
            expect(updatedUser!.user_metadata?.permissions).toBe(updateData.updates.permissions)
          }

          // Verify audit trail
          const auditLog = mockManager.getAuditLog()
          const updateLog = auditLog.find(log => 
            log.action === 'user_updated' && log.userId === updateData.userId
          )
          expect(updateLog).toBeDefined()
          expect(updateLog!.adminId).toBe('admin-test-id')
          expect(updateLog!.details).toEqual(updateData.updates)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should prevent unauthorized account modifications', () => {
    fc.assert(
      fc.property(
        userAccountUpdateArb,
        fc.uuid(), // non-admin user ID
        (updateData, nonAdminId) => {
          // Add a non-admin user
          const nonAdmin: User = {
            id: nonAdminId,
            email: 'user@test.com',
            role: 'tenant',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(nonAdmin)

          // Add target user to update
          const targetUser: User = {
            id: updateData.userId,
            email: 'target@test.com',
            role: 'landlord',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(targetUser)

          // Attempt to update user account with non-admin user
          const result = mockManager.updateUserAccount(updateData, nonAdminId)

          // Should fail due to insufficient permissions
          expect(result.success).toBe(false)
          expect(result.error).toMatch(/insufficient permissions|not authorized/i)

          // Verify user was not modified
          const unchangedUser = mockManager.getUser(updateData.userId)
          expect(unchangedUser).toEqual(targetUser)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should maintain complete audit trail for all administrative actions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            createAdminDataArb.map(data => ({ type: 'create', data })),
            userAccountUpdateArb.map(data => ({ type: 'update', data }))
          ),
          { minLength: 1, maxLength: 3 }
        ),
        (actions) => {
          // Clear any existing audit log
          mockManager.clear()
          
          // Re-add the test admin
          const testAdmin: User = {
            id: 'admin-test-id',
            email: 'admin@test.com',
            role: 'admin',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {
              first_name: 'Test',
              last_name: 'Admin',
              permissions: 'full'
            }
          }
          mockManager.addTestUser(testAdmin)

          let successfulActions = 0

          for (let i = 0; i < actions.length; i++) {
            const action = actions[i]
            
            if (action.type === 'create') {
              const result = mockManager.createAdminAccount(action.data, 'admin-test-id')
              if (result.success) successfulActions++
            } else if (action.type === 'update') {
              // Create target user first with unique ID
              const targetUser: User = {
                id: action.data.userId,
                email: `user-${i}@test.com`,
                role: 'tenant',
                is_active: true,
                is_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_metadata: {}
              }
              mockManager.addTestUser(targetUser)

              const result = mockManager.updateUserAccount(action.data, 'admin-test-id')
              if (result.success) successfulActions++
            }
          }

          // Verify audit log contains all successful actions
          const auditLog = mockManager.getAuditLog()
          expect(auditLog.length).toBe(successfulActions)

          // Verify each log entry has required fields
          auditLog.forEach(logEntry => {
            expect(logEntry.action).toBeDefined()
            expect(logEntry.userId).toBeDefined()
            expect(logEntry.adminId).toBe('admin-test-id')
            expect(logEntry.timestamp).toBeInstanceOf(Date)
            expect(logEntry.details).toBeDefined()
          })

          // Verify chronological order (most recent first)
          for (let i = 0; i < auditLog.length - 1; i++) {
            expect(auditLog[i].timestamp.getTime()).toBeGreaterThanOrEqual(
              auditLog[i + 1].timestamp.getTime()
            )
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})

describe('Property 22: Role-Based Access Control is Enforced', () => {
  let mockManager: MockAdminManager

  beforeEach(() => {
    mockManager = new MockAdminManager()
  })

  it('should enforce role-based access for any user and required role combination', () => {
    fc.assert(
      fc.property(
        fc.record({
          userRole: userRoleArb,
          isActive: fc.boolean(),
          requiredRole: userRoleArb
        }),
        fc.uuid(),
        (userData, userId) => {
          // Create test user
          const testUser: User = {
            id: userId,
            email: 'test@example.com',
            role: userData.userRole,
            is_active: userData.isActive,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(testUser)

          // Test access control
          const hasAccess = mockManager.hasRoleBasedAccess(userId, userData.requiredRole)

          // Verify access control logic
          if (!userData.isActive) {
            // Inactive users should never have access
            expect(hasAccess).toBe(false)
          } else if (userData.userRole === 'admin') {
            // Admins should always have access when active
            expect(hasAccess).toBe(true)
          } else {
            // Non-admin users should only have access to their own role
            expect(hasAccess).toBe(userData.userRole === userData.requiredRole)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should deny access to non-existent or inactive users', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        userRoleArb,
        (nonExistentUserId, requiredRole) => {
          // Test access for non-existent user
          const hasAccess = mockManager.hasRoleBasedAccess(nonExistentUserId, requiredRole)
          
          // Non-existent users should never have access
          expect(hasAccess).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should maintain consistent access control across multiple role checks', () => {
    fc.assert(
      fc.property(
        fc.record({
          userRole: userRoleArb,
          isActive: fc.boolean()
        }),
        fc.array(userRoleArb, { minLength: 3, maxLength: 6 }),
        fc.uuid(),
        (userData, rolesToCheck, userId) => {
          // Create test user
          const testUser: User = {
            id: userId,
            email: 'test@example.com',
            role: userData.userRole,
            is_active: userData.isActive,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          }
          mockManager.addTestUser(testUser)

          // Check access for multiple roles
          const accessResults = rolesToCheck.map(role => ({
            role,
            hasAccess: mockManager.hasRoleBasedAccess(userId, role)
          }))

          // Verify consistency
          accessResults.forEach(result => {
            if (!userData.isActive) {
              expect(result.hasAccess).toBe(false)
            } else if (userData.userRole === 'admin') {
              expect(result.hasAccess).toBe(true)
            } else {
              expect(result.hasAccess).toBe(userData.userRole === result.role)
            }
          })

          // If user is admin and active, all checks should return true
          if (userData.userRole === 'admin' && userData.isActive) {
            expect(accessResults.every(r => r.hasAccess)).toBe(true)
          }

          // If user is inactive, all checks should return false
          if (!userData.isActive) {
            expect(accessResults.every(r => !r.hasAccess)).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})