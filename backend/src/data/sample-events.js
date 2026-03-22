const buildSampleEvents = (adminId) => {
  const now = new Date();

  return [
    {
      title: 'Innovation Summit 2026',
      shortDescription:
        'A campus-wide showcase of product demos, student startups, and AI projects.',
      description:
        'Innovation Summit brings together student founders, faculty mentors, and industry speakers for a full-day experience focused on product thinking, rapid prototyping, and real-world problem solving.',
      category: 'Innovation',
      department: 'Computer Science',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000,
      ),
      venue: 'Central Convention Hall',
      mode: 'Hybrid',
      capacity: 320,
      registeredCount: 0,
      organizer: 'Campus Innovation Cell',
      keynote: 'Dr. Mira Nandan, VP of Applied AI',
      tags: ['AI', 'Startups', 'Demo Day'],
      coverGradient:
        'linear-gradient(135deg, #0f766e 0%, #134e4a 45%, #f59e0b 100%)',
      agenda: [
        {
          time: '09:00',
          title: 'Opening keynote',
          description:
            'A fast-moving look at student innovation and what industry expects next.',
        },
        {
          time: '12:00',
          title: 'Prototype showcase',
          description:
            'Teams demo products across accessibility and campus life.',
        },
      ],
      status: 'published',
      createdBy: adminId,
    },
    {
      title: '24-Hour Design Jam',
      shortDescription:
        'Cross-disciplinary teams reimagine student services through UX and service design.',
      description:
        'The Design Jam pairs designers, developers, and volunteers from student clubs to redesign parts of campus life in a mentor-led sprint.',
      category: 'Workshop',
      department: 'School of Design',
      startDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      venue: 'Maker Lab Studio',
      mode: 'In Person',
      capacity: 120,
      registeredCount: 0,
      organizer: 'Design Guild',
      keynote: 'Lina Sharma, Service Design Director',
      tags: ['UX', 'Research', 'Collaboration'],
      coverGradient:
        'linear-gradient(135deg, #1d4ed8 0%, #0f172a 55%, #38bdf8 100%)',
      agenda: [
        {
          time: '13:00',
          title: 'Challenge briefing',
          description:
            'Mentors unveil the service-design problem statements and judging criteria.',
        },
        {
          time: '12:00',
          title: 'Final showcase',
          description:
            'Rapid presentations followed by mentor feedback and awards.',
        },
      ],
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Green Campus Forum',
      shortDescription:
        'Talks, booths, and student-led initiatives focused on climate action on campus.',
      description:
        'This forum spotlights practical sustainability projects and helps students discover volunteer opportunities across campus initiatives.',
      category: 'Community',
      department: 'Environmental Club',
      startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(
        now.getTime() + 1 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000,
      ),
      venue: 'Eco Courtyard',
      mode: 'In Person',
      capacity: 200,
      registeredCount: 0,
      organizer: 'Sustainability Council',
      keynote: 'Aarav Menon, Climate Policy Fellow',
      tags: ['Sustainability', 'Volunteer', 'Community'],
      coverGradient:
        'linear-gradient(135deg, #166534 0%, #3f6212 45%, #bef264 100%)',
      agenda: [
        {
          time: '10:30',
          title: 'Campus impact stories',
          description:
            'Student teams share measurable wins and failures from the past semester.',
        },
        {
          time: '14:15',
          title: 'Action planning',
          description:
            'Participants choose one concrete sustainability action for the next month.',
        },
      ],
      status: 'published',
      createdBy: adminId,
    },
    {
      title: 'Cyber Defense Lab',
      shortDescription:
        'Hands-on security challenges for students interested in blue-team operations.',
      description:
        'Cyber Defense Lab is a practical event for students who want to explore threat detection and incident response workflows in a friendly learning environment.',
      category: 'Tech',
      department: 'Information Security',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(
        now.getTime() - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000,
      ),
      venue: 'Digital Security Center',
      mode: 'Virtual',
      capacity: 180,
      registeredCount: 0,
      organizer: 'Cyber Society',
      keynote: 'Neha Patel, Security Operations Lead',
      tags: ['Security', 'CTF', 'Hands-on'],
      coverGradient:
        'linear-gradient(135deg, #7c2d12 0%, #431407 55%, #fb923c 100%)',
      agenda: [
        {
          time: '11:00',
          title: 'Threat briefing',
          description:
            'A short walkthrough of attack simulation rules and event scoring.',
        },
        {
          time: '17:15',
          title: 'Lessons review',
          description:
            'Coaches unpack how small signals turned into a full incident narrative.',
        },
      ],
      status: 'completed',
      createdBy: adminId,
    },
  ];
};

module.exports = {
  buildSampleEvents,
};
