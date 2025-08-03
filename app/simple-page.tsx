"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Question {
  id: string
  question: string
  answer: string
  majorCategory: string
  minorCategory: string
  created_at?: string
}

// デフォルトデータ（41問）
const getDefaultQuestions = (): Question[] => [
  {
    id: "1",
    question: "下ごしらえにスパイスを使う目的は？",
    answer: "臭みとり、香りをしっかりつける、色を出す。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "下ごしらえ",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    question: "下ごしらえでのスパイスの使い方は？",
    answer: "素材にまぶす、漬け込む、下茹でに使う。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "下ごしらえ",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    question: "下ごしらえではどのタイプのスパイスを使うのが良い？",
    answer: "まんべんなく香りをつけるならパウダー、臭みとりやマリネにはホールスパイス。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "下ごしらえ",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    question: "調理中にスパイスを使う目的は？",
    answer: "香り、辛み、色をじっくり出すため。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "調理中",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    question: "調理中のスパイスの使い方は？",
    answer: "焼く前に振って一緒に加熱する。煮込む時や炊く時に加える。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "調理中",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    question: "調理中におすすめのスパイスは？（ドライ、フレッシュ）",
    answer:
      "ドライ: ホールでじっくり香りを出す。フレッシュ: ローズマリー、タイム、セージ、オレガノなどの強めのハーブ。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "調理中",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    question: "仕上げにスパイスを使う目的は？",
    answer: "香辛色を瞬時に加える。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "仕上げ",
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    question: "仕上げのスパイスの使い方は？",
    answer: "出来上がりに振りかける。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "仕上げ",
    created_at: new Date().toISOString(),
  },
  {
    id: "9",
    question: "仕上げにおすすめのスパイスは？（ドライ、フレッシュ）",
    answer: "ドライ: パウダータイプ。フレッシュ: ディル、チャービル、チャイブ、パセリなど香りがマイルドなもの。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "仕上げ",
    created_at: new Date().toISOString(),
  },
  {
    id: "10",
    question: "ハーブを加えすぎることを何という？",
    answer: "オーバースパイス。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "ハーブの扱い方",
    created_at: new Date().toISOString(),
  },
  {
    id: "11",
    question: "フレッシュハーブとドライハーブの使用量の違いは？",
    answer: "ドライ : フレッシュ = 1 : 3。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "ハーブの扱い方",
    created_at: new Date().toISOString(),
  },
  {
    id: "12",
    question: "1:3の比率に当てはまらないフレッシュハーブは？",
    answer: "ローズマリーやタイム（乾燥しても風味があまり変わらない）。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "ハーブの扱い方",
    created_at: new Date().toISOString(),
  },
  {
    id: "13",
    question: "フレッシュハーブの下準備での注意点は？",
    answer: "調理前に使う分だけ水洗いし、ペーパーで優しく包んで水気を取る。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "ハーブの扱い方",
    created_at: new Date().toISOString(),
  },
  {
    id: "14",
    question: "フレッシュハーブを刻む時の注意点は？",
    answer: "金気のある包丁は使わず、ステンレスかセラミックの包丁を使用。まな板にペーパーを敷いてカットする。",
    majorCategory: "スパイスの基本知識",
    minorCategory: "ハーブの扱い方",
    created_at: new Date().toISOString(),
  },
  {
    id: "15",
    question: "クスクスは何のスパイスを使ったどこの料理？",
    answer: "クミンやラセラヌーを使った北アフリカ（モロッコ）の料理。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "16",
    question: "クスクスはどんな料理？",
    answer: "クスクスという小粒パスタに肉野菜の煮込みスープをかけて食べる。ハリッサを添えることが多い。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "17",
    question: "ハリッサとは？",
    answer: "クミン、キャラウェイ、コリアンダー等のシード系スパイス＋唐辛子＋ガーリック＋オリーブ油で作るペースト。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "18",
    question: "刻みパセリのサラダはどこの何という料理？",
    answer: "レバノンの「タッブーレ」。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "19",
    question: "デュカという料理はどんなもの？",
    answer: "シード系スパイスとナッツを合わせたミックススパイスで、オリーブ油に浸したパンにつけて食べる。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "20",
    question: "デュカはどこの料理で、どんなスパイスが使われている？",
    answer: "北アフリカ〜中近東の料理。コリアンダー、ナッツ、ごま、クミンが使われている。",
    majorCategory: "世界の料理",
    minorCategory: "北アフリカ・中近東",
    created_at: new Date().toISOString(),
  },
  {
    id: "21",
    question: "イタリアのバジルを使った料理といえば？",
    answer: "カプレーゼ",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "22",
    question: "リゾット・アッラ・ミラネーゼについて説明は？",
    answer: "訳は『ミラノ風リゾット』。使うのはサフラン、パルメザンチーズなど。",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "23",
    question: "イタリアのサルティンボッカに使われているハーブは？",
    answer: "セージ",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "24",
    question: "サルティンボッカはどんな料理？",
    answer: "仔牛肉の薄切りに生ハム、セージをのせてバターソテー。料理名は『口に飛び込む』の意。",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "25",
    question: "イタリアの緑のパスタソースと言えば、名前と作り方は？",
    answer: "バジル＋パルメザンチーズ＋ニンニク＋オリーブ油。イタリア・ジェノバ地方のソース。",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "26",
    question: "カルボナーラの代表的な材料と発祥の地域は？",
    answer: "ベーコン＋卵＋ブラックペッパー。発祥はローマ。",
    majorCategory: "世界の料理",
    minorCategory: "イタリア",
    created_at: new Date().toISOString(),
  },
  {
    id: "27",
    question: "『ブイヤベース』の説明は？",
    answer: "フランスの郷土料理。魚介類を煮込み、トマトやサフランで香りをつけたスープ。",
    majorCategory: "世界の料理",
    minorCategory: "フランス",
    created_at: new Date().toISOString(),
  },
  {
    id: "28",
    question: "『パエリア』の発祥、意味、使われるスパイスは？",
    answer: "バレンシア発祥。スペイン語で『フライパン』を意味し、サフランが使われる。",
    majorCategory: "世界の料理",
    minorCategory: "スペイン",
    created_at: new Date().toISOString(),
  },
  {
    id: "29",
    question: "ハンガリーのスープ料理とスパイスは？",
    answer: "ハンガリアングラーシュ。スパイスはパプリカ。",
    majorCategory: "世界の料理",
    minorCategory: "東欧",
    created_at: new Date().toISOString(),
  },
  {
    id: "30",
    question: "ボルシチの発祥と食べられる国、材料は？",
    answer: "ウクライナ発祥。ロシアやヨーロッパで食べられている。材料は牛肉、ビーツ、ディル、サワークリーム。",
    majorCategory: "世界の料理",
    minorCategory: "東欧",
    created_at: new Date().toISOString(),
  },
  {
    id: "31",
    question: "トンポーロウとは？スパイスは？",
    answer: "中国浙江省の料理で、豚の角煮。スターアニス（八角）、シナモン、グローブが使われる。",
    majorCategory: "世界の料理",
    minorCategory: "中国",
    created_at: new Date().toISOString(),
  },
  {
    id: "32",
    question: "トムヤンクンに使われるスパイス・ハーブは？",
    answer: "赤唐辛子、レモングラス、カフェライムリーフ、パクチー、ライム、エビ。",
    majorCategory: "世界の料理",
    minorCategory: "タイ",
    created_at: new Date().toISOString(),
  },
  {
    id: "33",
    question: "バインセオとは？スパイス名と生地の材料は？",
    answer: "ベトナム風お好み焼き。スパイスはターメリック。生地は米粉。",
    majorCategory: "世界の料理",
    minorCategory: "ベトナム",
    created_at: new Date().toISOString(),
  },
  {
    id: "34",
    question: "アメリカのテクスメクスとは？",
    answer: "テキサス生まれのメキシコ風アメリカ料理。",
    majorCategory: "世界の料理",
    minorCategory: "アメリカ",
    created_at: new Date().toISOString(),
  },
  {
    id: "35",
    question: "テクスメクスに使われる代表的な料理とスパイスは？",
    answer: "チリコンカン。スパイスはチリパウダー、オレガノ。",
    majorCategory: "世界の料理",
    minorCategory: "アメリカ",
    created_at: new Date().toISOString(),
  },
  {
    id: "36",
    question: "チリパウダーの原料は？",
    answer: "ガーリック、オレガノ、クミン、パプリカ。",
    majorCategory: "世界の料理",
    minorCategory: "アメリカ",
    created_at: new Date().toISOString(),
  },
  {
    id: "37",
    question: "モロッコティーとは？",
    answer: "ガンパウダー（中国緑茶）＋ミント＋たっぷりの角砂糖のポットに熱湯を注ぐ。",
    majorCategory: "飲み物・ドリンク",
    minorCategory: "お茶",
    created_at: new Date().toISOString(),
  },
  {
    id: "38",
    question: "カルダモンコーヒーはどこの何という飲み物？",
    answer: "サウジアラビアの「ガーワ（アラビアンコーヒー）」。",
    majorCategory: "飲み物・ドリンク",
    minorCategory: "コーヒー",
    created_at: new Date().toISOString(),
  },
  {
    id: "39",
    question: "アメリカの冬の定番ドリンクと材料は？",
    answer: "エッグノッグ。材料は牛乳、卵、ナツメグ。",
    majorCategory: "飲み物・ドリンク",
    minorCategory: "その他",
    created_at: new Date().toISOString(),
  },
  {
    id: "40",
    question: "鍋で煮出して作るメキシコのコーヒーとスパイスは？",
    answer: "カフェデオーヤ。スパイスはシナモン。",
    majorCategory: "飲み物・ドリンク",
    minorCategory: "コーヒー",
    created_at: new Date().toISOString(),
  },
  {
    id: "41",
    question: "ヘミングウェイが愛したドリンク、国、材料は？",
    answer: "モヒート。キューバ発祥。ラム酒、ミント、ライムが材料。",
    majorCategory: "飲み物・ドリンク",
    minorCategory: "カクテル",
    created_at: new Date().toISOString(),
  },
]

export default function SimpleQuizApp() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    majorCategory: "",
    minorCategory: "",
  })

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 初期データ読み込み
  useEffect(() => {
    const savedQuestions = localStorage.getItem("quiz-questions")
    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions)
        setQuestions(parsedQuestions)
      } catch (error) {
        console.error("ローカルデータの読み込みエラー:", error)
        setQuestions(getDefaultQuestions())
      }
    } else {
      // 初回起動時はデフォルトデータを設定
      const defaultQuestions = getDefaultQuestions()
      setQuestions(defaultQuestions)
      localStorage.setItem("quiz-questions", JSON.stringify(defaultQuestions))
    }
  }, [])

  // データを保存する関数
  const saveQuestions = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions)
    localStorage.setItem("quiz-questions", JSON.stringify(newQuestions))
  }, [])

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

  const majorCategories = Object.keys(organizedQuestions)

  const handleAddQuestion = () => {
    const lastQuestion = questions[questions.length - 1]
    const newQuestion: Question = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      question: formData.question,
      answer: formData.answer,
      majorCategory: formData.majorCategory || lastQuestion?.majorCategory || "",
      minorCategory: formData.minorCategory || lastQuestion?.minorCategory || "",
      created_at: new Date().toISOString(),
    }

    const newQuestions = [...questions, newQuestion]
    saveQuestions(newQuestions)
    setFormData({ question: "", answer: "", majorCategory: "", minorCategory: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditQuestion = () => {
    if (!editingQuestion) return

    const updatedQuestions = questions.map((q) => (q.id === editingQuestion.id ? { ...q, ...formData } : q))

    saveQuestions(updatedQuestions)
    setEditingQuestion(null)
    setFormData({ question: "", answer: "", majorCategory: "", minorCategory: "" })
  }

  const handleDeleteQuestion = (id: string) => {
    const newQuestions = questions.filter((q) => q.id !== id)
    saveQuestions(newQuestions)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">一問一答テスト問題集</h1>
          <div className="text-xs text-gray-500">ローカル保存版</div>
        </div>

        {/* 問題数表示 */}
        <div className="text-sm text-gray-600 mb-4 text-center">
          全{questions.length}問 | {majorCategories.length}カテゴリ
        </div>

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
                  <h3 className="text-lg font-semibold mb-3 text-green-600 ml-4">
                    {minorCategory} ({categoryQuestions.length}問)
                  </h3>

                  <Accordion type="multiple" className="space-y-2">
                    {categoryQuestions.map((question) => (
                      <AccordionItem
                        key={question.id}
                        value={question.id}
                        className="border rounded-lg bg-white transition-all duration-200 hover:shadow-md"
                      >
                        <AccordionTrigger className="px-4 py-4 hover:no-underline cursor-pointer touch-manipulation">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-left font-medium">Q: {question.question}</span>
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
                          <div className="bg-blue-50 p-3 rounded-md">
                            <span className="font-medium text-blue-800">A: </span>
                            <span className="text-blue-700">{question.answer}</span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
