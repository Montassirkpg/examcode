const db = require('./../services/database');

exports.getAllEmprunts = (req, res) => {
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
}

exports.emprunterLivre = (req, res) => {
    try {
        const {livre_id, utilisateur_id} = req.params;
        const sql = 'INSERT INTO emprunts (livre_id, utilisateur_id, date_emprunt) VALUES (?, ?, NOW())';
        db.query(sql, [livre_id, utilisateur_id], (err) => {
            if (err) throw err
            res.send('Livre emprunté')
        })
        } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur')
    }
}

exports.getMesEmprunts = (req, res) => {
    try {
        const { utilisateur_id } = req.params;
        const sql = 'SELECT * FROM emprunts WHERE utilisateur_id = ?';
        db.query(sql, [utilisateur_id], (err, results) => {
            if (err) throw err;
            res.json(results);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
}

exports.retournerLivre = (req, res) => {
    try {
        const { livre_id, utilisateur_id } = req.params;
        const sql = 'UPDATE emprunts SET date_retour = NOW() WHERE livre_id = ? AND utilisateur_id = ? AND date_retour IS NULL';
        db.query(sql, [livre_id, utilisateur_id], (err) => {
            if (err) throw err;
            res.send('Livre retourné');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
}