
export const Header = () => (
  <div className="navbar bg-base-300 w-full">
    <div className="flex-none lg:hidden">
      <label htmlFor="main-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost drawer-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-6 w-6 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </label>
    </div>
    <div className="mx-2 flex-1 px-2">
      <h2>3M Tabletop - Mini Multiplayer Madness</h2>
    </div>
    <div className="hidden flex-none lg:block">
      <ul className="menu menu-horizontal">
        <li><button className="btn btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"><a href="/">Dashboard</a></button></li>
        <li><a>Navbar Item 2</a></li>
      </ul>
    </div>
  </div>
);