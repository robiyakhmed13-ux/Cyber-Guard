const { UserModel, AuditLogModel } = require('../models/sqliteModels');
const { generateToken, hashPassword, comparePassword } = require('../middleware/security');

class AuthService {
  static async register({ username, email, password, role }, metadata = {}) {
    const existingUser = UserModel.findByUsername(username);
    if (existingUser) {
      const error = new Error('Username already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(password);
    const user = UserModel.create({
      username,
      email,
      password_hash: passwordHash,
      role
    });

    AuditLogModel.create({
      action: 'user_register',
      resource: 'users',
      resource_id: String(user.id),
      ip_address: metadata.ip
    });

    return {
      user: {
        id: user.id,
        username,
        email,
        role: role || 'analyst'
      },
      token: generateToken({ id: user.id, username, role: role || 'analyst' })
    };
  }

  static async login({ username, password }, metadata = {}) {
    const user = UserModel.findByUsername(username);

    if (!user || !await comparePassword(password, user.password_hash)) {
      AuditLogModel.create({
        action: 'login_failed',
        resource: 'auth',
        details: { username },
        ip_address: metadata.ip
      });

      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    AuditLogModel.create({
      user_id: user.id,
      action: 'login success',
      resource: 'auth',
      ip_address: metadata.ip
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token: generateToken({ id: user.id, username: user.username, role: user.role }),
      expiresIn: '24h'
    };
  }
}

module.exports = AuthService;
