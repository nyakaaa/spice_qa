"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Plus, Edit, Trash2, Cloud, CloudOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"

interface Question {
  id: string
  question: string
  answer: string
  majorCategory: string
  minorCategory: string
  created_at?: string
  updated_at?: string
}

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let supabase: any = null
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export default function QuizApp() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // データの読み込み（クラウド優先、ローカルフォールバック）
  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setIsSyncing(true)
    setSyncError(null)

    try {
      // Supabaseが利用可能でオンラインの場合はクラウドから読み込み
      if (supabase && isOnline) {
        const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          setQuestions(data)
          // クラウドデータをローカルにも保存
          localStorage.setItem("quiz-questions", JSON.stringify(data))
          setLastSyncTime(new Date())
          setIsSyncing(false)
          return
        }
      }

      // クラウドにデータがない場合やオフラインの場合はローカルから読み込み
      const savedQuestions = localStorage.getItem("quiz-questions")
      if (savedQuestions) {
        const parsedQuestions = JSON.parse(savedQuestions)
        setQuestions(parsedQuestions)
      } else {
        // デフォルトデータを設定
        const defaultQuestions = [
          {
            id: "1",
            question: "イタリアのバジルを使った料理といえば？",
            answer: "カプレーゼ",
            majorCategory: "世界の料理",
            minorCategory: "イタリア",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            question: "リゾット・アッラ・ミラネーゼについて説明",
            answer: "訳は『ミラノ風リゾット』。使うのはサフラン、パルメザンチーズなど",
            majorCategory: "世界の料理",
            minorCategory: "イタリア",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            question: "『ブイヤベース』の説明",
            answer: "フランスの郷土料理。魚介類を煮込み、トマトやサフランで香りをつけたスープ",
            majorCategory: "世界の料理",
            minorCategory: "フランス",
            created_at: new Date().toISOString(),
          },
        ]
        setQuestions(defaultQuestions)
        localStorage.setItem("quiz-questions", JSON.stringify(defaultQuestions))
      }
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error)
      setSyncError("データの読み込みに失敗しました")

      // エラーの場合はローカルデータを使用
      const savedQuestions = localStorage.getItem("quiz-questions")
      if (savedQuestions) {
        const parsedQuestions = JSON.parse(savedQuestions)
        setQuestions(parsedQuestions)
      }
    }

    setIsSyncing(false)
  }

  // データの保存（クラウドとローカル両方）
  const saveQuestions = async (newQuestions: Question[]) => {
    // ローカルに即座に保存
    localStorage.setItem("quiz-questions", JSON.stringify(newQuestions))
    setQuestions(newQuestions)

    // オンラインでSupabaseが利用可能な場合はクラウドにも保存
    if (supabase && isOnline) {
      try {
        setIsSyncing(true)
        setSyncError(null)

        // 既存のデータを削除してから新しいデータを挿入
        await supabase.from("questions").delete().neq("id", "")

        const questionsToInsert = newQuestions.map((q) => ({
          ...q,
          updated_at: new Date().toISOString(),
        }))

        const { error } = await supabase.from("questions").insert(questionsToInsert)

        if (error) throw error

        setLastSyncTime(new Date())
      } catch (error) {
        console.error("クラウド同期に失敗しました:", error)
        setSyncError("クラウド同期に失敗しました。ローカルに保存されています。")
      } finally {
        setIsSyncing(false)
      }
    }
  }

  // 手動同期
  const handleManualSync = async () => {
    if (!supabase || !isOnline) return
    await loadQuestions()
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    majorCategory: "",
    minorCategory: "",
  })

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [draggedQuestion, setDraggedQuestion] = useState<Question | null>(null)
  const [dropTarget, setDropTarget] = useState<{ majorCategory: string; minorCategory: string; index: number } | null>(
    null,
  )

  // カテゴリ別に問題を整理
  const organizedQuestions = questions.reduce(
    (acc, question) => {
      const majorKey = question.majorCategory
      if (!acc[majorKey]) {
        acc[majorKey] = {}
      }
      const minorKey = question.minorCategory
      if (!acc[majorKey][minorKey]) {
        acc[majorKey][minorKey] = []
      }
      acc[majorKey][minorKey].push(question)
      return acc
    },
    {} as { [major: string]: { [minor: string]: Question[] } },
  )

  // 大カテゴリ一覧を取得
  const majorCategories = Object.keys(organizedQuestions)

  const handleAddQuestion = async () => {
    const lastQuestion = questions[questions.length - 1]
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: formData.question,
      answer: formData.answer,
      majorCategory: formData.majorCategory || lastQuestion?.majorCategory || "",
      minorCategory: formData.minorCategory || lastQuestion?.minorCategory || "",
      created_at: new Date().toISOString(),
    }

    const newQuestions = [...questions, newQuestion]
    await saveQuestions(newQuestions)
    setFormData({ question: "", answer: "", majorCategory: "", minorCategory: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditQuestion = async () => {
    if (!editingQuestion) return

    const updatedQuestions = questions.map((q) =>
      q.id === editingQuestion.id ? { ...q, ...formData, updated_at: new Date().toISOString() } : q,
    )

    await saveQuestions(updatedQuestions)
    setEditingQuestion(null)
    setFormData({ question: "", answer: "", majorCategory: "", minorCategory: "" })
  }

  const handleDeleteQuestion = async (id: string) => {
    const newQuestions = questions.filter((q) => q.id !== id)
    await saveQuestions(newQuestions)
  }

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      answer: question.answer,
      majorCategory: question.majorCategory,
      minorCategory: question.minorCategory,
    })
  }

  const scrollToCategory = (category: string) => {
    const element = categoryRefs.current[category]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleDragStart = (e: React.DragEvent, question: Question) => {
    setDraggedQuestion(question)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, majorCategory: string, minorCategory: string, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTarget({ majorCategory, minorCategory, index })
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (
    e: React.DragEvent,
    targetMajorCategory: string,
    targetMinorCategory: string,
    targetIndex: number,
  ) => {
    e.preventDefault()

    if (!draggedQuestion) return

    // ドラッグされた問題を削除
    const updatedQuestions = questions.filter((q) => q.id !== draggedQuestion.id)

    // 新しい位置に挿入するための処理
    const targetCategoryQuestions = updatedQuestions.filter(
      (q) => q.majorCategory === targetMajorCategory && q.minorCategory === targetMinorCategory,
    )

    const otherQuestions = updatedQuestions.filter(
      (q) => !(q.majorCategory === targetMajorCategory && q.minorCategory === targetMinorCategory),
    )

    // 問題を新しいカテゴリと位置で更新
    const movedQuestion = {
      ...draggedQuestion,
      majorCategory: targetMajorCategory,
      minorCategory: targetMinorCategory,
      updated_at: new Date().toISOString(),
    }

    // 指定された位置に挿入
    targetCategoryQuestions.splice(targetIndex, 0, movedQuestion)

    // 全ての問題を再構築
    const newQuestions = [...otherQuestions, ...targetCategoryQuestions]

    await saveQuestions(newQuestions)
    setDraggedQuestion(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedQuestion(null)
    setDropTarget(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">一問一答テスト問題集</h1>

          {/* 同期状態表示 */}
          <div className="flex items-center gap-2">
            {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
            {supabase ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-2"
              >
                {isOnline ? (
                  <Cloud className="w-4 h-4 text-green-600" />
                ) : (
                  <CloudOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs">{isOnline ? "オンライン" : "オフライン"}</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CloudOff className="w-4 h-4" />
                ローカル保存のみ
              </div>
            )}
          </div>
        </div>

        {/* 同期エラー表示 */}
        {syncError && (
          <Alert className="mb-4">
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}

        {/* 最終同期時刻表示 */}
        {lastSyncTime && supabase && (
          <div className="text-xs text-gray-500 mb-4 text-center">最終同期: {lastSyncTime.toLocaleString()}</div>
        )}

        {/* カテゴリリンクエリア */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">カテゴリ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {majorCategories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToCategory(category)}
                  className="text-sm px-3 py-2 h-auto min-h-[2rem]"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 問題追加ボタン */}
        <div className="mb-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                新しい問題を追加
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg mx-4">
              <DialogHeader>
                <DialogTitle>新しい問題を追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="majorCategory">大カテゴリ（任意）</Label>
                  <Input
                    id="majorCategory"
                    value={formData.majorCategory}
                    onChange={(e) => setFormData({ ...formData, majorCategory: e.target.value })}
                    placeholder="例: 世界の料理"
                    className="h-10 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="minorCategory">中カテゴリ（任意）</Label>
                  <Input
                    id="minorCategory"
                    value={formData.minorCategory}
                    onChange={(e) => setFormData({ ...formData, minorCategory: e.target.value })}
                    placeholder="例: イタリア"
                    className="h-10 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="question">質問</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="質問を入力してください"
                    required
                    className="min-h-[4rem] text-base resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="answer">回答</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="回答を入力してください"
                    required
                    className="min-h-[4rem] text-base resize-none"
                  />
                </div>
                <Button
                  onClick={handleAddQuestion}
                  disabled={!formData.question || !formData.answer}
                  className="w-full"
                >
                  追加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 問題一覧 */}
        <div className="space-y-6">
          {majorCategories.map((majorCategory) => (
            <div key={majorCategory} ref={(el) => (categoryRefs.current[majorCategory] = el)} className="scroll-mt-4">
              <h2 className="text-xl font-bold mb-4 text-blue-700">{majorCategory}</h2>

              {Object.entries(organizedQuestions[majorCategory]).map(([minorCategory, categoryQuestions]) => (
                <div key={minorCategory} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-600 ml-4">{minorCategory}</h3>

                  <Accordion type="multiple" className="space-y-2">
                    {categoryQuestions.map((question, index) => (
                      <div key={question.id}>
                        {/* ドロップゾーン（問題の上） */}
                        <div
                          className={`h-2 transition-all duration-200 ${
                            dropTarget?.majorCategory === majorCategory &&
                            dropTarget?.minorCategory === minorCategory &&
                            dropTarget?.index === index
                              ? "bg-blue-200 border-2 border-dashed border-blue-400 rounded"
                              : ""
                          }`}
                          onDragOver={(e) => handleDragOver(e, majorCategory, minorCategory, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, majorCategory, minorCategory, index)}
                        />

                        <AccordionItem
                          value={question.id}
                          className={`border rounded-lg bg-white transition-all duration-200 hover:shadow-md ${
                            draggedQuestion?.id === question.id ? "opacity-50 scale-95" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, question)}
                          onDragEnd={handleDragEnd}
                        >
                          <AccordionTrigger className="px-4 py-4 hover:no-underline cursor-pointer touch-manipulation">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <div className="w-3 h-10 bg-gray-300 rounded mr-3 flex flex-col justify-center cursor-grab active:cursor-grabbing">
                                  <div className="w-full h-0.5 bg-gray-500 mb-1"></div>
                                  <div className="w-full h-0.5 bg-gray-500 mb-1"></div>
                                  <div className="w-full h-0.5 bg-gray-500"></div>
                                </div>
                                <span className="text-left font-medium">Q: {question.question}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditDialog(question)
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-gray-100"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="w-[95vw] max-w-lg mx-4">
                                    <DialogHeader>
                                      <DialogTitle>問題を編集</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="editMajorCategory">大カテゴリ</Label>
                                        <Input
                                          id="editMajorCategory"
                                          value={formData.majorCategory}
                                          onChange={(e) => setFormData({ ...formData, majorCategory: e.target.value })}
                                          className="h-10 text-base"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editMinorCategory">中カテゴリ</Label>
                                        <Input
                                          id="editMinorCategory"
                                          value={formData.minorCategory}
                                          onChange={(e) => setFormData({ ...formData, minorCategory: e.target.value })}
                                          className="h-10 text-base"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editQuestion">質問</Label>
                                        <Textarea
                                          id="editQuestion"
                                          value={formData.question}
                                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                          className="min-h-[4rem] text-base resize-none"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editAnswer">回答</Label>
                                        <Textarea
                                          id="editAnswer"
                                          value={formData.answer}
                                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                          className="min-h-[4rem] text-base resize-none"
                                        />
                                      </div>
                                      <Button onClick={handleEditQuestion} className="w-full">
                                        更新
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteQuestion(question.id)
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3">
                            <div className="bg-blue-50 p-3 rounded-md ml-8">
                              <span className="font-medium text-blue-800">A: </span>
                              <span className="text-blue-700">{question.answer}</span>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 最後の問題の後のドロップゾーン */}
                        {index === categoryQuestions.length - 1 && (
                          <div
                            className={`h-2 transition-all duration-200 ${
                              dropTarget?.majorCategory === majorCategory &&
                              dropTarget?.minorCategory === minorCategory &&
                              dropTarget?.index === index + 1
                                ? "bg-blue-200 border-2 border-dashed border-blue-400 rounded"
                                : ""
                            }`}
                            onDragOver={(e) => handleDragOver(e, majorCategory, minorCategory, index + 1)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, majorCategory, minorCategory, index + 1)}
                          />
                        )}
                      </div>
                    ))}
                  </Accordion>
                  {/* カテゴリの最後に空のドロップゾーン */}
                  <div
                    className={`h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm transition-all duration-200 hover:border-gray-400 ${
                      dropTarget?.majorCategory === majorCategory &&
                      dropTarget?.minorCategory === minorCategory &&
                      dropTarget?.index === categoryQuestions.length
                        ? "border-blue-400 bg-blue-50 text-blue-600"
                        : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, majorCategory, minorCategory, categoryQuestions.length)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, majorCategory, minorCategory, categoryQuestions.length)}
                  >
                    ここに問題をドロップ
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
