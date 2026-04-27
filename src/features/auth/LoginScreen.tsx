import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { APP_CONFIG } from "@/constants";
import { LoadingScreen } from "@/components/LoadingScreen";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="flex items-center justify-center min-h-screen px-4"
    >
      <Card className="w-full max-w-md glass border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient mb-2">
            Welcome to {APP_CONFIG.name}
          </CardTitle>
          <p className="text-gray-400 text-lg">
            {APP_CONFIG.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={onLogin}
            className="w-full h-12 text-lg font-medium"
            size="lg"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3.1l6.1-6.1C34.5 5.2 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.1-2.7-.3-4z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 3.1l6.1-6.1C34.5 5.2 29.6 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"/>
                <path fill="#FBBC05" d="M24 45c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.8 36 24 36 24 36c-5.8 0-10.7-1.9-14.3-5.2z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3.1l6.1-6.1C34.5 5.2 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.1-2.7-.3-4z" opacity=".1"/>
              </g>
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
} 