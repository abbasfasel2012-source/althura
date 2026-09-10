import webpush from 'npm:web-push@3'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

webpush.setVapidDetails(
  'mailto:admin@althura.iq',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { user_ids, title, body, url } = await req.json()

  // جلب الاشتراكات — إما لمستخدمين محددين أو للكل
  let q = supabase.from('push_subscriptions').select('*')
  if (Array.isArray(user_ids) && user_ids.length) q = q.in('user_id', user_ids)

  const { data: subs, error } = await q
  if (error) return new Response(JSON.stringify({ error: error.message }), {
    status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
  })

  const payload = JSON.stringify({ title, body, url: url ?? '/' })
  let sent = 0, failed = 0

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload,
      )
      sent++
    } catch (e: any) {
      // اشتراك منتهي → احذفه تلقائياً
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
      failed++
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
