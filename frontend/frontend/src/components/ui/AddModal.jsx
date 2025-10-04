import React, { useState, useRef } from 'react';

const sampleExercises = [
  { id: 1, type: 'word', label: 'objetivo', lang: 'es', text: 'objetivo', translation: 'target' },
  { id: 2, type: 'word', label: 'hola', lang: 'es', text: 'hola', translation: 'hello' },
  { id: 3, type: 'sentence', label: 'Esta es la palabra objetivo', lang: 'es', text: 'Esta es la palabra objetivo', translation: 'This is the target word' },
  { id: 4, type: 'translation', label: '¿Cómo estás?', lang: 'es', text: '¿Cómo estás?', translation: 'How are you?' },
];

const AddModal = ({ onClose }) => {
  const [exercises] = useState(sampleExercises);
  const [activeId, setActiveId] = useState(exercises[0].id);
  const [difficulty, setDifficulty] = useState('medium');
  const audioRef = useRef(null);

  const active = exercises.find((e) => e.id === activeId) || exercises[0];

  const playAudio = (text) => {
    // Use SpeechSynthesis as a lightweight TTS for demo purposes
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = active.lang || 'en-US';
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Study / Training</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column - exercise list */}
          <div className="md:col-span-1">
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${ex.id === activeId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}
                  onClick={() => setActiveId(ex.id)}
                >
                  <div>
                    <div className="font-medium text-gray-800">{ex.label}</div>
                    <div className="text-xs text-gray-500">{ex.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); playAudio(ex.text); }}
                      className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md"
                      aria-label={`Play ${ex.type}`}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - detail / target area */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Current</div>
                  <h2 className="text-2xl font-bold text-gray-800 mt-2">{active.text}</h2>
                  <p className="text-gray-600 mt-2">{active.translation}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => playAudio(active.text)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md"
                  >
                    Play
                  </button>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border rounded-md px-2 py-1">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Example sentence area / notes */}
              <div className="mt-6">
                <div className="text-sm text-gray-500 mb-2">Example</div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <p className="text-gray-700">{active.type === 'sentence' ? active.text : `${active.text} — ${active.translation}`}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
                <button onClick={() => alert('Marked as learned (demo)')} className="px-4 py-2 rounded-md bg-green-500 text-white">Mark Learned</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddModal;