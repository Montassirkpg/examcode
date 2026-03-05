import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const base = import.meta.env.VITE_BASE_URL || '/'

const EditBook = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState({
        cover: '',
        title: '',
        author: '',
        description: '',
        date_publication: '',
        isbn: ''
    });
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch(`${base}api/books/${bookId}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => setBook(data))
            .catch(error => console.error('Erreur:', error));
    }, [bookId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBook(prevBook => ({
            ...prevBook,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccess(false);

        try {
            const response = await fetch(`${base}api/books/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book),
                credentials: 'include'
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/books'), 2000); // Redirect after 2 seconds
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || ['Une erreur est survenue']);
            }
        } catch (error) {
            setErrors([error.message]);
        }
    };

    return (
        <div className="container">
            {success && <p>Le livre a été mis à jour avec succès.</p>}
            {errors.length > 0 && (
                <ul>
                    {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            )}
            <form onSubmit={handleSubmit}>
                <label htmlFor="cover">URL de l'image :</label>
                <input
                    type="text"
                    name="cover"
                    value={book.cover}
                    onChange={handleChange}
                    required
                />
                <label htmlFor="title">Titre :</label>
                <input
                    type="text"
                    name="title"
                    value={book.title}
                    onChange={handleChange}
                    required
                />
                <br />
                <label htmlFor="author">Auteur :</label>
                <input
                    type="text"
                    name="author"
                    value={book.author}
                    onChange={handleChange}
                    required
                />
                <br />
                <label htmlFor="description">Description :</label>
                <textarea
                    name="description"
                    value={book.description}
                    onChange={handleChange}
                    required
                />
                <br />
                <label htmlFor="date_publication">Date de Publication :</label>
                <input
                    type="date"
                    name="date_publication"
                    value={book.date_publication}
                    onChange={handleChange}
                    required
                />
                <br />
                <label htmlFor="isbn">ISBN :</label>
                <input
                    type="text"
                    name="isbn"
                    value={book.isbn}
                    onChange={handleChange}
                    required
                />
                <br />
                <button type="submit">Mettre à jour le Livre</button>
            </form>
        </div>
    );
};

export default EditBook