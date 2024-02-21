const express = require('express');
const router = express.Router();
const Book = require('../config/models/book');
const ReverseIndex = require('../config/models/reverse_index');
const JaccardScore = require('../config/models/jaccardScore');
const { reverseIndex } = require('../managers/book');

router.get('/fetch', async (req, res) => {
    try {
        await fetchAndStoreBooks();
        const books = await Book.find().exec(); // Utilisez await ici
        res.json(books); // Utilisez res.json pour envoyer les résultats
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/reverse', async (req, res) => {
    try {
        const reversedIndexes = await reverseIndex();
        console.log(typeof(reversedIndexes)); // Doit afficher 'object' si c'est un objet
        await Promise.all(Object.entries(reversedIndexes).map(async ([token, books]) => {
            console.log(token, ' : ', books);
            const reverseIndex = new ReverseIndex({ token, books });
            await reverseIndex.save();
        }));
        res.json(reversedIndexes);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


// Ajouté dans back/routes/books.js
router.get('/search', async (req, res) => {
    const query = req.query.q; // Assume 'q' est le paramètre de requête contenant le terme de recherche
    if (!query) {
        return res.status(400).send({ error: 'Query parameter is missing' });
    }

    try {
        const reverseIndexEntry = await ReverseIndex.findOne({ token: query });
        if (!reverseIndexEntry) {
            return res.status(404).send({ message: 'No results found' });
        }

        // Optionnellement, convertir la Map en objet pour la réponse JSON
        const books = Object.fromEntries(reverseIndexEntry.books);
        res.json({ token: query, books });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


router.get('/suggestions', async (req, res) => {
    const docId = req.query.docId; // L'ID du document pour lequel obtenir des suggestions
    try {
        const suggestions = await JaccardScore.findOne({ docId }).exec();
        const sortedSimilarDocs = suggestions.similarDocs.sort((a, b) => b.score - a.score);
        const topSimilarDocs = sortedSimilarDocs.slice(1, 6);
        
        if (!suggestions) {
            return res.status(404).send({ message: 'No suggestions found for this document.' });
        }
        res.json(topSimilarDocs);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});





router.get('/', async (req, res) => {
    try {
        const books = await Book.find().populate('authors').exec(); 
        res.json(books);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});



router.get('/:id', (req, res) => {
    res.send('One book');
});

module.exports = router;
