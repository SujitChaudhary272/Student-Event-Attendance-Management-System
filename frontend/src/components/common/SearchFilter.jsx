import React from "react";

export default function SearchFilter({
  search,
  setSearch,
  category,
  setCategory
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10">
      {/* Search */}
      <input
        type="text"
        placeholder="Search clubs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/2 px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500"
      />

      {/* Filter */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full md:w-1/4 px-4 py-3 rounded-lg border shadow-sm"
      >
        <option value="All">All Categories</option>
        <option value="Academic">Academic</option>
        <option value="Sports">Sports</option>
        <option value="Arts">Arts</option>
      </select>
    </div>
  );
}
