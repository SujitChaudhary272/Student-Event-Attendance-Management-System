import { useState } from "react";

export default function ClubUpload({ addClub }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Technology");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);

  const formData = new FormData();
  formData.append("name", name);
  formData.append("category", category);
  formData.append("description", description);
  if (image) formData.append("image", image);

  await addClub(formData);

  setLoading(false);

  setName("");
  setCategory("Technology");
  setDescription("");
  setImage(null);
};


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Club Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option>Technology</option>
        <option>Sports</option>
        <option>Arts</option>
        <option>Academic</option>
      </select>

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <input type="file" accept="image/*"  onChange={(e) => setImage(e.target.files[0])} />

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Adding..." : "Add Club"}
      </button>

    </form>
  );
}
