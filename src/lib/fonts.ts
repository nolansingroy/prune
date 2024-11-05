import { Exo_2, Montserrat, Roboto, Inter, Open_Sans } from "next/font/google";

export const exo_2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: "normal",
  display: "swap",
  variable: "--xo2",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--montserrat",
});

export const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["300", "400", "500", "700", "900"],
  variable: "--roboto",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--inter",
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--opensans",
});
