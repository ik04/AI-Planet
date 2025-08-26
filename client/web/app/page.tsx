import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="rounded-full w-9 h-9 flex items-center justify-center">
            <img src="/assets/logo.png" alt="" />
          </div>
          <span className="font-semibold text-lg">GenAI Stack</span>
        </div>
      </header>

      <main className="px-8 pt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            My Stacks
          </h2>
          <div className="flex items-center bg-red-200 gap-4">
            <button className="bg-viper-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition">
              + New Stack
            </button>
          </div>
        </div>
        <hr className="mb-12 border-gray-200" />
        <div className="flex justify-center items-center h-[50vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 w-[350px] flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Create New Stack
            </h3>

            <p className="text-gray-600 mb-6 text-center">
              Start building your generative AI apps with our essential tools
              and frameworks
            </p>
            <button className="bg-viper-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition">
              + New Stack
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
