import { NextRequest, NextResponse } from 'next/server'

export type Job = {
  id: string
  title: string
  company: string
  companyLogo?: string
  location: string
  country: string
  type: string
  applyUrl: string
  postedAt?: string
  salary?: string
  description?: string
  source: 'jsearch' | 'remotive'
}

export type JobSearchResult = {
  jobs: Job[]
  total: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJSearch(query: string, location: string): Promise<Job[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  const searchQuery = location ? `${query} in ${location}` : query
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1&page=1`

  try {
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data ?? []).slice(0, 15).map((j: any) => ({
      id: j.job_id as string,
      title: j.job_title as string,
      company: j.employer_name as string,
      companyLogo: j.employer_logo as string | undefined,
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
      country: (j.job_country as string) ?? '',
      type: (j.job_employment_type as string) ?? 'CDI',
      applyUrl: j.job_apply_link as string,
      postedAt: j.job_posted_at_datetime_utc as string | undefined,
      salary: j.job_min_salary
        ? `${Number(j.job_min_salary).toLocaleString()}–${Number(j.job_max_salary).toLocaleString()} ${j.job_salary_currency}`
        : undefined,
      description: (j.job_description as string | undefined)?.slice(0, 220),
      source: 'jsearch' as const,
    }))
  } catch {
    return []
  }
}

async function fetchRemotive(query: string): Promise<Job[]> {
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=15`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.jobs ?? []).slice(0, 15).map((j: any) => ({
      id: String(j.id),
      title: j.title as string,
      company: j.company_name as string,
      companyLogo: (j.company_logo_url as string | undefined) || (j.company_logo as string | undefined),
      location: (j.candidate_required_location as string) || 'Worldwide',
      country: 'Remote',
      type: (j.job_type as string) || 'Full-time',
      applyUrl: j.url as string,
      postedAt: j.publication_date as string | undefined,
      salary: (j.salary as string) || undefined,
      description: (j.description as string | undefined)?.replace(/<[^>]*>/g, '').slice(0, 220),
      source: 'remotive' as const,
    }))
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') ?? 'développeur'
  const location = searchParams.get('location') ?? 'Madagascar'
  const mode = searchParams.get('mode') ?? 'all'

  try {
    let jobs: Job[] = []
    const hasKey = !!process.env.RAPIDAPI_KEY

    if (mode === 'remote') {
      jobs = await fetchRemotive(query)
    } else if (mode === 'local') {
      jobs = await fetchJSearch(query, location)
      if (jobs.length === 0 && !hasKey) {
        return NextResponse.json({ jobs: [], total: 0, missingKey: true } satisfies JobSearchResult & { missingKey?: boolean })
      }
    } else {
      const [local, remote] = await Promise.all([
        fetchJSearch(query, location),
        fetchRemotive(query),
      ])
      jobs = [...local, ...remote].slice(0, 20)
      if (local.length === 0 && !hasKey) {
        return NextResponse.json({ jobs: remote, total: remote.length, missingKey: true } satisfies JobSearchResult & { missingKey?: boolean })
      }
    }

    return NextResponse.json({ jobs, total: jobs.length } satisfies JobSearchResult)
  } catch (err) {
    console.error('[jobs]', err)
    return NextResponse.json({ error: "Erreur lors de la recherche d'offres." }, { status: 500 })
  }
}
