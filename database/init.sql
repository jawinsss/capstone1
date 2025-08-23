CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);


INSERT INTO users (id, email, username, password, full_name, phone, role, is_active) 
VALUES (
    'admin-001',
    'ngotam120704@gmail.com',
    'ngotam',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ngo minh tam',
    '0905626568',
    'ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- -- Insert sample user (password: user123)
-- INSERT INTO users (id, email, username, password, full_name, phone, role, is_active) 
-- VALUES (
--     'user-001',
--     'user@example.com',
--     'user',
--     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user123
--     'Sample User',
--     '0987654321',
--     'USER',
--     true
-- ) ON CONFLICT (email) DO NOTHING;
