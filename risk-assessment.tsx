import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from "lucide-react"

interface RiskFactor {
  name: string
  percentage: number
  color?: string
}

interface RiskAssessmentProps {
  riskLevel: "low" | "moderate" | "high"
  factors: RiskFactor[]
  title?: string
}

export function RiskAssessment({ riskLevel, factors, title = "AI Prediction" }: RiskAssessmentProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500/10 text-green-600"
      case "moderate":
        return "bg-accent/10 text-accent"
      case "high":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-accent/10 text-accent"
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "low":
        return "Low"
      case "moderate":
        return "Moderate"
      case "high":
        return "High"
      default:
        return "Moderate"
    }
  }

  return (
    <Card className="border-l-4 border-l-accent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className={getRiskColor(riskLevel)}>
            {getRiskLabel(riskLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {factors.map((factor, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{factor.name}</span>
                <span>{factor.percentage}%</span>
              </div>
              <Progress value={factor.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
