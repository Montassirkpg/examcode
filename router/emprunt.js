const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./../middleware/auth');
const empruntController = require('./../controllers/emprunt-controller');

router.get('/', empruntController.getAllEmprunts);
router.get('/livre/:livre_id', empruntController.getEmpruntsByLivre);
router.post('/emprunter/:livre_id', authenticateToken, empruntController.emprunterLivre);
router.get('/mesemprunts/:utilisateur_id', authenticateToken, empruntController.getMesEmprunts);
router.post('/retourner/:emprunt_id', authenticateToken, empruntController.retournerLivre);

module.exports = router;