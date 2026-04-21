import { loginUser, registerUser } from "../services/auth.service.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await registerUser(name, email, password, role);

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { token, user } = await loginUser(email, password);

    res.json({
      token,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
