import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, User, Calendar } from "lucide-react"
import { getVolunteerFeedback, type VolunteerFeedback } from "@/services/feedbackService"

interface VolunteerFeedbackDisplayProps {
  volunteerId: number
}

export function VolunteerFeedbackDisplay({ volunteerId }: VolunteerFeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<VolunteerFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    loadFeedback()
  }, [volunteerId])

  const loadFeedback = async () => {
    setIsLoading(true)
    try {
      const volunteerFeedback = await getVolunteerFeedback(volunteerId)
      setFeedback(volunteerFeedback)
      
      // Calculate average rating
      const ratings = volunteerFeedback.filter(fb => fb.rating > 0).map(fb => fb.rating)
      const avg = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0
      setAverageRating(Number(avg.toFixed(1)))
    } catch (error) {
      console.error("Error loading feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'rejected':
        return 'bg-red-500'
      case 'needs_improvement':
        return 'bg-yellow-500'
      case 'pending':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'needs_improvement':
        return 'Needs Improvement'
      case 'pending':
        return 'Pending Review'
      default:
        return status
    }
  }

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'validation':
        return <User className="w-4 h-4" />
      case 'performance':
        return <Star className="w-4 h-4" />
      case 'general':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Loading feedback...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Admin Feedback
          </CardTitle>
          {feedback.length > 0 && (
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {feedback.length} Reviews
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No feedback yet</p>
            <p className="text-sm text-slate-500">Admins will provide feedback on your reports and performance</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-2xl font-bold text-white">{averageRating}</p>
                <p className="text-xs text-slate-400">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white mb-1">
                  {feedback.filter(fb => fb.status === 'approved').length}
                </p>
                <p className="text-xs text-slate-400">Approved Reports</p>
              </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFeedbackTypeIcon(item.feedback_type)}
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          item.status === 'approved' ? 'border-green-500/50 text-green-400' :
                          item.status === 'rejected' ? 'border-red-500/50 text-red-400' :
                          item.status === 'needs_improvement' ? 'border-yellow-500/50 text-yellow-400' :
                          'border-blue-500/50 text-blue-400'
                        }`}
                      >
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.admin_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{item.feedback_type} Feedback</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < item.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>

                  {item.comments && (
                    <div className="mt-3 p-3 bg-slate-700/30 rounded-lg">
                      <p className="text-sm text-slate-300">{item.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}