import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user, profile, session, loading: authLoading } = useAuth();

  const runDebugTests = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Test 1: Basic Supabase connection
      console.log('🔍 Debug: Testing basic Supabase connection...');
      const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
      info.supabaseConnection = testError ? { error: testError.message } : { success: true, data: testData };

      // Test 2: Auth session
      console.log('🔍 Debug: Testing auth session...');
      const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
      info.authSession = authError ? { error: authError.message } : { success: true, session: !!authSession };

      // Test 3: Database tables
      console.log('🔍 Debug: Testing database tables...');
      const tables = ['profiles', 'leads', 'organisations', 'scanned_bills'];
      info.databaseTables = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count').limit(1);
          info.databaseTables[table] = error ? { error: error.message } : { success: true };
        } catch (e) {
          info.databaseTables[table] = { error: (e as Error).message };
        }
      }

      // Test 4: Storage buckets
      console.log('🔍 Debug: Testing storage buckets...');
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        info.storageBuckets = bucketError ? { error: bucketError.message } : { success: true, buckets: buckets?.length || 0 };
      } catch (e) {
        info.storageBuckets = { error: (e as Error).message };
      }

    } catch (error) {
      info.generalError = (error as Error).message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    runDebugTests();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Debug Information</span>
          <Button onClick={runDebugTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </CardTitle>
        <CardDescription>
          Current authentication and connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Authentication Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Auth Loading:</span>
                <Badge variant={authLoading ? 'destructive' : 'default'}>
                  {authLoading ? 'Loading' : 'Complete'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>User:</span>
                <Badge variant={user ? 'default' : 'secondary'}>
                  {user ? 'Logged In' : 'Not Logged In'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile:</span>
                <Badge variant={profile ? 'default' : 'secondary'}>
                  {profile ? 'Loaded' : 'Not Loaded'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Session:</span>
                <Badge variant={session ? 'default' : 'secondary'}>
                  {session ? 'Active' : 'No Session'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">User Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
              <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
              <div><strong>Profile Role:</strong> {profile?.role || 'N/A'}</div>
              <div><strong>Organisation:</strong> {profile?.organisation?.name || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Connection Tests */}
        <div>
          <h3 className="font-semibold mb-2">Connection Tests</h3>
          <div className="space-y-2">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="border rounded p-2">
                <div className="font-medium">{key}:</div>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo; 