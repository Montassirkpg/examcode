const express = require('express')
const bodyParser = require('body-parser')
const booksrouter = require('./router/books')
const usersRouter = require('./router/users')
const empruntRouter = require('./router/emprunt');
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const cookieParser = require('cookie-parser')
const db = require('./services/database')
const { authenticateToken, isAdmin, getAuthCookieOptions } = require('./middleware/auth')

const corsOptions = {
    origin: 'https://exam.andragogy.fr',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
}

const router = express.Router()
router.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],  // Autorise uniquement les scripts du domaine
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'http://localhost:3000'],
        },
    },
    xssFilter: true,
}));
router.use(bodyParser.json());
router.use(cors(corsOptions));
router.use(cookieParser());
router.use('/api/books', booksrouter);
router.use('/api/users', usersRouter);
router.use('/api/emprunts', empruntRouter);

router.post('/api/logout', (req, res) => {
    res.clearCookie('token', getAuthCookieOptions());
    res.json({ message: 'Deconnexion reussie' });
});

router.get('/api/session', authenticateToken, (req, res) => {
    if (req?.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Non authentifie' });
    }
});

router.get('/api/statistics', authenticateToken, isAdmin, (req, res) => {
    const totalBooksQuery = 'SELECT COUNT(*) AS total_books FROM livres';
    const totalUsersQuery = 'SELECT COUNT(*) AS total_users FROM utilisateurs';

    db.query(totalBooksQuery, (err, booksResult) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }
        db.query(totalUsersQuery, (err, usersResult) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ message: 'Erreur serveur' })
            }
            res.json({
                total_books: booksResult[0].total_books,
                total_users: usersResult[0].total_users
            });
        });
    });
});

router.use('/', express.static(path.join(__dirname, "./webpub")))
router.use(express.static(path.join(__dirname, "./webpub")))
router.use('/*', (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
})
router.get("*", (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
});

module.exports = router;