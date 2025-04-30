'use client';

import { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { usePrompt } from './PromptContext';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { setPrompt } = usePrompt();

    const promptSuggestions = [
        'Get all products with a price greater than 500',
        'Show sales data for the last 6 months',
        'Compare revenue between Q1 and Q2',
        'List top 5 customers by purchase amount',
        'Display website traffic for the past week',
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Hamburger Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-800 hover:text-gray-900 focus:outline-none mb-4"
                aria-label="Toggle prompt suggestions"
            >
                <FiMenu size={24} />
            </button>

            {/* Prompt Suggestions (shown when isOpen is true) */}
            {isOpen && (
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Prompt Suggestions</h3>
                    <ul className="space-y-2">
                        {promptSuggestions.map((prompt, index) => (
                            <li key={index}>
                                <button
                                    className="text-gray-700 hover:text-gray-900 text-sm text-left w-full"
                                    onClick={() => {
                                        setPrompt(prompt);
                                        setIsOpen(false); // Optionally close the suggestions after selection
                                    }}
                                >
                                    {prompt}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}