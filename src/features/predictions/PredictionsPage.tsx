import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarEvent, Transaction } from "@/types";
import { detectAnomalies, forecastByCategory, generateFutureDates, predictHabitualExpenses } from "@/lib/behavioralModel";
import { formatDate } from "@/lib/utils";

interface PredictionsPageProps {
  events: CalendarEvent[];
  transactions: Transaction[];
}

export function PredictionsPage({ events, transactions }: PredictionsPageProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const forecastDays = timeframe === "week" ? 7 : timeframe === "month" ? 30 : 90;
  const futureDates = useMemo(() => generateFutureDates(forecastDays), [forecastDays]);
  const habitPredictions = useMemo(
    () => predictHabitualExpenses(transactions, futureDates),
    [transactions, futureDates]
  );
  const behaviorByCategory = useMemo(() => forecastByCategory(transactions, forecastDays), [transactions, forecastDays]);
  const anomalies = useMemo(() => detectAnomalies(transactions, 2), [transactions]);

  const eventPredictions = useMemo(
    () =>
      events
        .filter((event) => new Date(event.start) > new Date())
        .map((event) => {
          const range = event.expectedSpendingRange || [0, 0];
          const average = (range[0] + range[1]) / 2;
          return {
            category: event.category || "Other",
            predictedAmount: average * (event.spendingProbability || 0),
            confidence: event.confidence || 0.4,
            source: "Events Mode",
            nextOccurrence: new Date(event.start),
          };
        }),
    [events]
  );

  const behaviorPredictions = behaviorByCategory.map((entry) => ({
    category: entry.category,
    predictedAmount: entry.amount,
    confidence: 0.7,
    source: "Behavioral Mode",
    nextOccurrence: futureDates[0],
  }));

  const predictions = [...behaviorPredictions, ...eventPredictions];

  const filteredPredictions =
    selectedCategory === "all" ? predictions : predictions.filter((p) => p.category === selectedCategory);

  const totalPredicted = filteredPredictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Spending Predictions</h1>
          <p className="text-gray-400">
            Advanced AI analysis of your spending patterns and calendar events
          </p>
        </div>
        <Button disabled className="bg-purple-600 hover:bg-purple-700 opacity-80">
          Behavioral model active
        </Button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Categories</option>
          {Array.from(new Set(predictions.map(p => p.category))).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Predicted</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${totalPredicted.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔮</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-blue-400">
                  {behaviorByCategory.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(filteredPredictions.length, 1) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Event-Based</p>
                <p className="text-2xl font-bold text-orange-400">
                  {eventPredictions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Detailed Predictions</h2>
        
        {filteredPredictions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPredictions.map((prediction, index) => (
              <Card key={index} className="glass hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{prediction.category}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                          {(prediction.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge className="bg-gray-700 text-gray-200 border-gray-600">
                          {prediction.source}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">
                        ${prediction.predictedAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{timeframe}ly prediction</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Model source:</p>
                      <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/20 text-xs">
                        {prediction.source}
                      </Badge>
                    </div>

                    {prediction.nextOccurrence && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Next Expected:</span>
                        <span className="text-white font-medium">
                          {formatDate(prediction.nextOccurrence)}
                        </span>
                      </div>
                    )}

                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔮</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Predictions Yet</h3>
              <p className="text-gray-400 mb-4">
                Generate AI predictions based on your spending patterns and calendar events.
              </p>
              <Button disabled className="bg-purple-600 hover:bg-purple-700">
                Generate Predictions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Behavioral Insights */}
      {predictions.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Behavioral Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Daily Habit Forecast</h4>
                <div className="space-y-3">
                  {habitPredictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{formatDate(prediction.date)}</p>
                        <p className="text-gray-400 text-sm">
                          Predicted spend ${prediction.predictedSpend.toFixed(2)}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/20">
                        Habit model
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Anomaly Alerts</h4>
                <div className="space-y-3">
                  {anomalies.slice(0, 4).map((anomaly) => (
                    <div key={anomaly.transactionId} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 font-medium text-sm">
                        ⚠️ Outlier in {anomaly.category}
                      </p>
                      <p className="text-gray-400 text-xs">
                        ${anomaly.amount.toFixed(2)} (z-score {anomaly.zScore.toFixed(2)})
                      </p>
                    </div>
                  ))}
                  {anomalies.length === 0 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm">
                      No major anomalies detected in recent spending.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 