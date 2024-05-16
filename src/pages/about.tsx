import Link from "next/link";

const AboutPage: React.FC = () => {
  return (
    <div>
      <h1>About Page</h1>
      <p>Welcome to the About page!</p>
      <Link href="/">Go back to home</Link>
    </div>
  );
};

export default AboutPage;
