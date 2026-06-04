export type PortfolioAspect = "square" | "wide" | "tall";

export type PortfolioItem = {
  id: number;
  category: string;
  title: string;
  img: string;
  aspect: PortfolioAspect;
  accent: string;
};

export const heroShowcaseImage =
  "https://images.pexels.com/photos/7148384/pexels-photo-7148384.jpeg?auto=compress&cs=tinysrgb&w=1800";

export const portfolioCategories = [
  "All",
  "Birthday",
  "Anniversary",
  "Sketch",
  "Poster",
  "Retouching",
];

export const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    category: "Birthday",
    title: "Birthday Celebration Collage",
    img: "https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "tall",
    accent: "rose",
  },
  {
    id: 2,
    category: "Anniversary",
    title: "Golden Anniversary Edit",
    img: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "wide",
    accent: "amber",
  },
  {
    id: 3,
    category: "Sketch",
    title: "Portrait Pencil Sketch",
    img: "https://images.pexels.com/photos/1053924/pexels-photo-1053924.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "slate",
  },
  {
    id: 4,
    category: "Poster",
    title: "Event Poster Design",
    img: "https://images.pexels.com/photos/1552617/pexels-photo-1552617.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "cyan",
  },
  {
    id: 5,
    category: "Retouching",
    title: "Premium Portrait Retouch",
    img: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "tall",
    accent: "violet",
  },
  {
    id: 6,
    category: "Sketch",
    title: "Color Digital Sketch",
    img: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "emerald",
  },
  {
    id: 7,
    category: "Birthday",
    title: "Family Birthday Frame",
    img: "https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "wide",
    accent: "rose",
  },
  {
    id: 8,
    category: "Anniversary",
    title: "Wedding Anniversary Edit",
    img: "https://images.pexels.com/photos/1415131/pexels-photo-1415131.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "amber",
  },
  {
    id: 9,
    category: "Poster",
    title: "Corporate Poster",
    img: "https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "tall",
    accent: "cyan",
  },
  {
    id: 10,
    category: "Retouching",
    title: "Glamour Portrait",
    img: "https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "violet",
  },
  {
    id: 11,
    category: "Birthday",
    title: "Kids Birthday Special",
    img: "https://images.pexels.com/photos/1543793/pexels-photo-1543793.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "rose",
  },
  {
    id: 12,
    category: "Sketch",
    title: "Couple Color Sketch",
    img: "https://images.pexels.com/photos/1007066/pexels-photo-1007066.jpeg?auto=compress&cs=tinysrgb&w=900",
    aspect: "square",
    accent: "emerald",
  },
];
