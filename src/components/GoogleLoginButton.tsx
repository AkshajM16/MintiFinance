import { startGoogleLogin } from "@/lib/oauth";
export default function GoogleLoginButton() {
  return <button onClick={() => void startGoogleLogin()} className="w-full px-4 py-2 bg-blue-600 text-white rounded">Sign in with Google</button>;
}
