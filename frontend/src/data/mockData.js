// ✅ mockData.js (React JavaScript Format)

export const mockEvents = [
  {
    id: "evt-1",
    title: "Web Development Workshop",
    description: "Learn modern web development with React and TypeScript",
    category: "Technology",
    date: "2026-02-15",
    time: "14:00",
    location: "Tech Hub Room 301",
    organizer: "Tech Wizards",
    organizerId: "org-1",
    capacity: 50,
    registered: 32,
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    status: "upcoming",
  },

  {
    id: "evt-2",
    title: "Data Science Bootcamp",
    description: "Dive into machine learning and data analysis techniques",
    category: "Technology",
    date: "2026-02-20",
    time: "10:00",
    location: "Science Building Auditorium",
    organizer: "AI Society",
    organizerId: "org-2",
    capacity: 100,
    registered: 87,
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    status: "upcoming",
  },

  {
    id: "evt-3",
    title: "Entrepreneurship Summit",
    description: "Connect with startup founders and learn about building businesses",
    category: "Business",
    date: "2026-02-10",
    time: "09:00",
    location: "Main Campus Convention Center",
    organizer: "Sports United",
    organizerId: "org-3",
    capacity: 200,
    registered: 156,
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    status: "upcoming",
  },

  {
    id: "evt-4",
    title: "Photography Exhibition",
    description: "Showcase of student photography work and networking event",
    category: "Arts",
    date: "2026-02-25",
    time: "18:00",
    location: "Art Gallery",
    organizer: "Artistry Hub",
    organizerId: "org-1",
    capacity: 75,
    registered: 75,
    imageUrl:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
    status: "completed",
  },

  {
    id: "evt-5",
    title: "Hackathon 2026",
    description: "24-hour coding competition with amazing prizes",
    category: "Technology",
    date: "2026-03-01",
    time: "08:00",
    location: "Innovation Lab",
    organizer: "Tech Club",
    organizerId: "org-1",
    capacity: 120,
    registered: 98,
    imageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    status: "upcoming",
  },

  {
    id: "evt-6",
    title: "Mental Health Awareness Workshop",
    description: "Learn about mental wellness and stress management techniques",
    category: "Health",
    date: "2026-02-18",
    time: "15:00",
    location: "Wellness Center",
    organizer: "Health Society",
    organizerId: "org-4",
    capacity: 40,
    registered: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    status: "upcoming",
  },
];


// ✅ Registrations Data
export const mockRegistrations = [
  {
    id: "reg-1",
    eventId: "evt-1",
    studentId: "student-1",
    studentName: "John Doe",
    studentEmail: "john.doe@university.edu",
    registeredAt: "2026-01-15T10:30:00Z",
    attended: false,
    qrCode: "QR-EVT1-STD1-2026",
  },

  {
    id: "reg-2",
    eventId: "evt-4",
    studentId: "student-1",
    studentName: "John Doe",
    studentEmail: "john.doe@university.edu",
    registeredAt: "2026-01-10T14:20:00Z",
    attended: true,
    qrCode: "QR-EVT4-STD1-2026",
  },

  {
    id: "reg-3",
    eventId: "evt-3",
    studentId: "student-1",
    studentName: "John Doe",
    studentEmail: "john.doe@university.edu",
    registeredAt: "2026-01-20T09:15:00Z",
    attended: false,
    qrCode: "QR-EVT3-STD1-2026",
  },
];


// ✅ Organizer Applications Data
export const mockOrganizerApplications = [
  {
    id: "app-1",
    name: "Sarah Johnson",
    email: "sarah.j@university.edu",
    organization: "Robotics Club",
    reason:
      "I want to organize robotics workshops and competitions for students interested in automation and AI.",
    status: "pending",
    appliedAt: "2026-01-28T10:00:00Z",
  },

  {
    id: "app-2",
    name: "Michael Chen",
    email: "michael.c@university.edu",
    organization: "Music Society",
    reason:
      "Planning to host concerts and music theory workshops to promote musical talent on campus.",
    status: "pending",
    appliedAt: "2026-01-29T14:30:00Z",
  },

  {
    id: "app-3",
    name: "Emily Rodriguez",
    email: "emily.r@university.edu",
    organization: "Sustainability Initiative",
    reason:
      "Want to organize environmental awareness events and sustainability workshops.",
    status: "approved",
    appliedAt: "2026-01-20T11:45:00Z",
  },

  {
    id: "app-4",
    name: "David Kim",
    email: "david.k@university.edu",
    organization: "Gaming Club",
    reason:
      "Looking to host e-sports tournaments and game development workshops.",
    status: "pending",
    appliedAt: "2026-01-30T16:20:00Z",
  },
];
