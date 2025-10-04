import React, { useState } from 'react';

const sampleExercises = [
  { id: 1, type: 'word', label: 'objetivo', lang: 'es', text: 'objetivo', translation: 'target' },
  { id: 2, type: 'word', label: 'hola', lang: 'es', text: 'hola', translation: 'hello' },
  { id: 3, type: 'sentence', label: 'Esta es la palabra objetivo', lang: 'es', text: 'Esta es la palabra objetivo', translation: 'This is the target word' },
  { id: 4, type: 'translation', label: '¿Cómo estás?', lang: 'es', text: '¿Cómo estás?', translation: 'How are you?' },
];

const StatsModal = ({ onClose }) => {
  const [exercises] = useState(sampleExercises);
  const [activeId, setActiveId] = useState(exercises[0].id);

  const active = exercises.find((e) => e.id === activeId) || exercises[0];

  const playAudio = (text, lang = 'en-US') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Progress / Study Stats</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">×</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: exercises list */}
          <div className="md:col-span-1">
            <div className="text-sm text-gray-500 mb-2">Exercises</div>
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => setActiveId(ex.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${ex.id === activeId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}
                >
                  <div>
                    <div className="font-medium text-gray-800">{ex.label}</div>
                    <div className="text-xs text-gray-500">{ex.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); playAudio(ex.text, ex.lang); }} className="p-2 bg-gray-100 rounded-md">▶</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: active detail */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Target</div>
                  <h2 className="text-2xl font-bold text-gray-800 mt-2">{active.text}</h2>
                  <p className="text-gray-600 mt-2">{active.translation}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => playAudio(active.text, active.lang)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md">Play</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-500 mb-2">Context / Example</div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <p className="text-gray-700">{active.type === 'sentence' ? active.text : `${active.text} — ${active.translation}`}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="text-sm text-gray-600">Difficulty:</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-md border">Easy</button>
                  <button className="px-3 py-1 rounded-md border">Medium</button>
                  <button className="px-3 py-1 rounded-md border">Hard</button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;