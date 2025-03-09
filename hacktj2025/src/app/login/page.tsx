import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0911] p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <form className="flex flex-col space-y-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="mt-2 text-purple-200 text-sm">
              Sign in to continue your journey
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-white/20 rounded-lg border border-purple-300/30 text-white placeholder-purple-200 
                          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full px-4 py-3 bg-white/20 rounded-lg border border-purple-300/30 text-white placeholder-purple-200 
                          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              formAction={login}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg
                        transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Log in
            </button>
            <button
              formAction={signup}
              className="flex-1 bg-transparent border-2 border-purple-400 text-purple-200 font-semibold py-3 px-6 rounded-lg
                        hover:bg-purple-400/20 transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
