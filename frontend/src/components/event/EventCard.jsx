import React from "react";
import { useNavigate } from "react-router-dom";

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleRegister = () => {
    // Replace with API call later
    alert(`Registered for ${event.title}`);
    navigate("/student/dashboard"); // Redirect to dashboard after registration
  };

  const handleExplore = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-2xl transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
      <p className="text-gray-600 mb-1">{event.type}</p>
      <p className="text-gray-500 text-sm mb-3">
        {event.startDate} - {event.endDate}
      </p>
      <span
        className={`inline-block px-3 py-1 mb-3 rounded-full text-sm font-medium ${
          event.state === "Live"
            ? "bg-green-200 text-green-800"
            : event.state === "Registration Open"
            ? "bg-indigo-200 text-indigo-800"
            : event.state === "Draft"
            ? "bg-gray-200 text-gray-800"
            : "bg-purple-200 text-purple-800"
        }`}
      >
        {event.state}
      </span>

      <div className="flex justify-between mt-4">
        <button
          onClick={handleRegister}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
        >
          Register
        </button>
        <button
          onClick={handleExplore}
          className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded hover:bg-indigo-50"
        >
          Explore
        </button>
      </div>
    </div>
  );
};

export default EventCard;
