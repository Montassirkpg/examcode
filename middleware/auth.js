const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')

if (!process.env.JWT_SECRET) {
    console.warn('[security] JWT_SECRET is missing in .env, using a temporary process secret.')
}

function authenticateToken(req, res, next) {
    const token = req.cookies?.token
    if (!token) return res.sendStatus(401)

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acces interdit' })
    }
    next()
}

function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    }
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    isAdmin,
    getAuthCookieOptions
}
