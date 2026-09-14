"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeLinkedInCode } from '@/features/linkedin/api';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setErrorMessage(errorDescription || error || 'LinkedIn authorization was declined or cancelled.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code found in URL query parameters.');
      return;
    }

    const processCode = async () => {
      try {
        const redirectUri = window.location.origin + '/linkedin-callback';
        await exchangeLinkedInCode(code, redirectUri);
        setStatus('success');
        
        // Auto-redirect after 1.5 seconds
        setTimeout(() => {
          router.replace('/linkedin');
        }, 1500);
      } catch (err: any) {
        console.error('LinkedIn callback exchange failed:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to exchange token with server.');
      }
    };

    processCode();
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-md p-8 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff] flex flex-col items-center text-center">
      {status === 'processing' && (
        <>
          <div className="w-14 h-14 border-4 border-black dark:border-white border-t-transparent animate-spin mb-6" />
          <h2 className="font-mono font-black uppercase tracking-wider text-base text-black dark:text-white mb-2">
            CONNECTING LINKEDIN...
          </h2>
          <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            Exchanging authorization tokens and retrieving your profile. Please wait.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-6 animate-bounce" />
          <h2 className="font-mono font-black uppercase tracking-wider text-base text-black dark:text-white mb-2">
            CONNECTED SUCCESSFULLY!
          </h2>
          <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 mb-4">
            Your LinkedIn account is now connected and ready for auto-posting. Redirecting...
          </p>
          <Link
            href="/linkedin"
            className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            GO TO POST STUDIO <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="w-14 h-14 text-rose-500 mb-6" />
          <h2 className="font-mono font-black uppercase tracking-wider text-base text-black dark:text-white mb-2">
            CONNECTION FAILED
          </h2>
          <p className="font-mono text-xs text-rose-600 dark:text-rose-400 mb-6">
            {errorMessage}
          </p>
          <Link
            href="/linkedin"
            className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            RETURN TO APP <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:bg-black">
      <Suspense
        fallback={
          <div className="p-8 border-4 border-black dark:border-white bg-white dark:bg-black font-mono font-bold text-xs uppercase">
            LOADING AUTH HANDLER...
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
