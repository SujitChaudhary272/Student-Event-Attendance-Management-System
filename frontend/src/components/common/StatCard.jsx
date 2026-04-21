import React from "react";

const StatCard = ({ title, value }) => {
  return (
    <div className="ucef-card ucef-card-hover p-6 text-center">
      <h3 className="mb-2 text-sm text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-blue-700">{value}</p>
    </div>
  );
};

export default StatCard;
