
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Page, Note } from '../types';
import { TrashIcon } from '../components/Icons';

const NoteEditPage: React.FC<{ noteId: number | null }> = ({ noteId }) => {
    const { getNoteById, updateNote, deleteNote, tags, addTag, navigateBack } = useContext(AppContext);

    const [note, setNote] = useState<Note | null>(null);
    const [newTag, setNewTag] = useState('');
    const isInitialLoad = useRef(true);

    useEffect(() => {
        if (noteId) {
            const existingNote = getNoteById(noteId);
            if (existingNote) {
                setNote(existingNote);
            }
        }
    }, [noteId, getNoteById]);

    // Autosave with debounce
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }
        if (note && note.id) {
            const handler = setTimeout(() => {
                updateNote(note);
            }, 500); // 500ms debounce
            return () => clearTimeout(handler);
        }
    }, [note, updateNote]);

    if (!note) {
        return <div className="p-4">Loading note...</div>;
    }

    const handleTagToggle = (tag: string) => {
        const currentTags = note.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        setNote(prev => prev ? ({ ...prev, tags: newTags }) : null);
    };

    const handleAddTag = () => {
        if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
            addTag(newTag.trim());
            handleTagToggle(newTag.trim());
            setNewTag('');
        }
    };

    const handleDelete = () => {
        if (note.id) {
            deleteNote(note.id);
            navigateBack();
        }
    };

    const handleNavigateBack = () => {
        // Save immediately before navigating back
        if (note && note.id) {
            updateNote(note);
        }
        navigateBack();
    };

    return (
        <div className="p-4">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Edit Note</h1>
                <div>
                     <button onClick={handleNavigateBack} className="px-4 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 mr-2">Done</button>
                    {noteId && <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-6 h-6" /></button>}
                </div>
            </header>
            <div className="space-y-6">
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 sr-only">Content</label>
                    <textarea
                        name="content"
                        id="content"
                        value={note.content}
                        onChange={e => setNote(prev => prev ? ({...prev, content: e.target.value}) : null)}
                        rows={15}
                        required
                        className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        placeholder="Start writing your note..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map(tag => (
                            <button type="button" key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1 rounded-full text-sm ${(note.tags || []).includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag..." className="flex-grow p-2 border rounded-l-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                        <button type="button" onClick={handleAddTag} className="bg-slate-200 dark:bg-slate-600 px-4 rounded-r-md">Add</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteEditPage;