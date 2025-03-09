import Link from "next/link";

export default function Projects() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Project Gallery</h1>
          <p className="text-zinc-400">
            Explore and manage your music projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/da/create/4" className="group">
            <div className="border border-zinc-800 rounded-lg p-6 hover:border-purple-500 transition-colors bg-zinc-900">
              <div className="flex items-center justify-center h-40 bg-zinc-800 rounded-md mb-4 group-hover:bg-zinc-700 transition-colors">
                <svg
                  className="w-12 h-12 text-zinc-400 group-hover:text-purple-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                Create New Project
              </h2>
              <p className="text-zinc-400">
                Start a new music project from scratch
              </p>
            </div>
          </Link>

          {/* Example Project Cards */}
          <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
            <div className="h-40 bg-zinc-800 rounded-md mb-4 flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">My First Track</h2>
            <p className="text-zinc-400 mb-4">Last edited 2 days ago</p>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>4 tracks</span>
              <span>3:45</span>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
            <div className="h-40 bg-zinc-800 rounded-md mb-4 flex items-center justify-center">
              <span className="text-4xl">🎹</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Piano Composition</h2>
            <p className="text-zinc-400 mb-4">Last edited 5 days ago</p>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>2 tracks</span>
              <span>2:30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
