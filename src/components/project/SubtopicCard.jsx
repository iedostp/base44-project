import React from "react";
import { Lightbulb } from "lucide-react";

export default function SubtopicCard({ subtopic }) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Lightbulb className="w-4 h-4 text-blue-600" />
        </div>
        <h5 className="font-semibold text-gray-800 flex-1 text-end">{subtopic.title}</h5>
      </div>
      <p className="text-sm text-gray-600 mb-3 leading-relaxed text-end">{subtopic.description}</p>
      <ul className="text-sm text-gray-600 space-y-2">
        {subtopic.tips?.map((tip, tipIndex) => (
          <li key={tipIndex} className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span className="flex-1">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}