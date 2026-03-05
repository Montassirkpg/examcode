const express = require('express');
const router = express.Router();
const db = require('./../services/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'HelloThereImObiWan';

function authenticateToken(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}


router.get('/',(req,res)=>{
    try {
        const sql = 'SELECT * FROM emprunts';
        db.query(sql, (err, results) => {
            if (err) throw err
            res.json(results)
        })   
    }
     catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur')
    }
})

router.get('/livre/:livre_id', (req, res) => {
    try {
        const { livre_id } = req.params;
        const sql = `
            SELECT
                e.id,
                e.livre_id,
                e.utilisateur_id,
                e.date_emprunt,
                e.date_retour,
                u.nom,
                u.prenom,
                u.email
            FROM emprunts e
            INNER JOIN utilisateurs u ON u.id = e.utilisateur_id
            WHERE e.livre_id = ?
            ORDER BY e.date_emprunt DESC
        `;
        db.query(sql, [livre_id], (err, results) => {
            if (err) throw err;
            res.json(results);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});

router.post('/emprunter/:livre_id', authenticateToken, (req, res) => {
    const utilisateur_id = req.user.id;
    const { livre_id } = req.params;

    const checkSql = 'SELECT id FROM emprunts WHERE livre_id = ? AND date_retour IS NULL LIMIT 1';
    db.query(checkSql, [livre_id], (checkErr, activeRows) => {
        if (checkErr) {
            console.error(checkErr);
            return res.status(500).send('Erreur serveur');
        }

        if (activeRows.length > 0) {
            return res.status(409).json({ message: 'Ce livre est deja emprunte' });
        }

        const nextIdSql = 'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM emprunts';
        db.query(nextIdSql, (idErr, idRows) => {
            if (idErr) {
                console.error(idErr);
                return res.status(500).json({ message: 'Erreur serveur (id emprunt)' });
            }

            const nextId = idRows[0].next_id;
            const insertSql = 'INSERT INTO emprunts (id, livre_id, utilisateur_id, date_emprunt) VALUES (?, ?, ?, CURDATE())';
            db.query(insertSql, [nextId, livre_id, utilisateur_id], (insertErr) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ message: 'Erreur serveur (creation emprunt)' });
                }

                const updateBookSql = "UPDATE livres SET statut = 'emprunté' WHERE id = ?";
                db.query(updateBookSql, [livre_id], (updateErr) => {
                    if (updateErr) {
                        console.error(updateErr);
                        return res.status(500).json({ message: 'Erreur serveur (maj livre)' });
                    }

                    return res.status(201).json({
                        id: nextId,
                        livre_id: Number(livre_id),
                        utilisateur_id,
                        message: 'Livre emprunte',
                        date_retour_prevue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    });
                });
            });
        });
    });
});

router.get('/mesemprunts/:utilisateur_id', authenticateToken, (req,res)=>{
    try {
        const { utilisateur_id } = req.params;
        if (req.user.role !== 'admin' && Number(utilisateur_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Acces interdit' });
        }

        const sql = `
            SELECT
                e.id,
                e.livre_id,
                e.utilisateur_id,
                e.date_emprunt,
                e.date_retour,
                DATE_ADD(e.date_emprunt, INTERVAL 30 DAY) AS date_retour_prevue,
                l.titre,
                l.photo_url
            FROM emprunts e
            INNER JOIN livres l ON l.id = e.livre_id
            WHERE e.utilisateur_id = ?
            ORDER BY e.date_emprunt DESC
        `;
        db.query(sql, [utilisateur_id], (err, results) => {
            if (err) throw err;
            res.json(results);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});

router.post('/retourner/:emprunt_id', authenticateToken, (req,res)=>{
    const { emprunt_id } = req.params;

    const loadSql = 'SELECT id, livre_id, utilisateur_id FROM emprunts WHERE id = ? AND date_retour IS NULL LIMIT 1';
    db.query(loadSql, [emprunt_id], (loadErr, rows) => {
        if (loadErr) {
            console.error(loadErr);
            return res.status(500).send('Erreur serveur');
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Emprunt introuvable ou deja retourne' });
        }

        const row = rows[0];
        if (req.user.role !== 'admin' && Number(row.utilisateur_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Acces interdit' });
        }

        const retourSql = 'UPDATE emprunts SET date_retour = NOW() WHERE id = ?';
        db.query(retourSql, [emprunt_id], (retourErr) => {
            if (retourErr) {
                console.error(retourErr);
                return res.status(500).send('Erreur serveur');
            }

            const updateBookSql = "UPDATE livres SET statut = 'disponible' WHERE id = ?";
            db.query(updateBookSql, [row.livre_id], (bookErr) => {
                if (bookErr) {
                    console.error(bookErr);
                    return res.status(500).send('Erreur serveur');
                }

                return res.json({ message: 'Livre retourne' });
            });
        });
    });
});

module.exports = router;