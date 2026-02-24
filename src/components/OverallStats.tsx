"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { getLanguageColor, formatBytes } from "@/lib/utils";
import { UserAnalysis } from "@/lib/github";

interface OverallStatsProps {
  analysis: UserAnalysis;
}

export default function OverallStats({ analysis }: OverallStatsProps) {
  const { user, overallLanguages, totalBytes, totalRepos } = analysis;

  const pieData = overallLanguages.slice(0, 15);
  const barData = overallLanguages.slice(0, 20).map((l, i) => ({
    ...l,
    fill: getLanguageColor(l.name, i),
  }));

  return (
    <div className="space-y-8">
      {/* User Profile Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">
              {user.name || user.login}
            </h1>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors"
            >
              @{user.login}
            </a>
            {user.bio && (
              <p className="mt-2 text-white/90 max-w-xl">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-6 mt-4 justify-center md:justify-start">
              <div>
                <span className="text-2xl font-bold">{totalRepos}</span>
                <span className="text-white/70 ml-1 text-sm">Repo</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{user.followers}</span>
                <span className="text-white/70 ml-1 text-sm">Takipçi</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{user.following}</span>
                <span className="text-white/70 ml-1 text-sm">Takip</span>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {formatBytes(totalBytes)}
                </span>
                <span className="text-white/70 ml-1 text-sm">Toplam Kod</span>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {overallLanguages.length}
                </span>
                <span className="text-white/70 ml-1 text-sm">Dil</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Language Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          📊 Genel Dil Dağılımı (Tüm Repolar)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Yüzdelik Dağılım
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) =>
                    value > 2 ? `${name} ${value}%` : ""
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={getLanguageColor(entry.name, index)}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${formatBytes((props?.payload as { bytes: number })?.bytes ?? 0)})`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Boyut Karşılaştırması
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(350, barData.length * 36)}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatBytes(v)}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatBytes(Number(value)), "Boyut"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Bar dataKey="bytes" radius={[0, 6, 6, 0]} barSize={20} animationDuration={800}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={getLanguageColor(entry.name, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Legend Table */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
            Detaylı Tablo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    Dil
                  </th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    Yüzde
                  </th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    Boyut
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-1/2">
                    Oran
                  </th>
                </tr>
              </thead>
              <tbody>
                {overallLanguages.map((lang, i) => (
                  <tr
                    key={lang.name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                          style={{
                            backgroundColor: getLanguageColor(lang.name, i),
                          }}
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {lang.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      %{lang.value}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {formatBytes(lang.bytes)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(lang.value, 0.5)}%`,
                            backgroundColor: getLanguageColor(lang.name, i),
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
