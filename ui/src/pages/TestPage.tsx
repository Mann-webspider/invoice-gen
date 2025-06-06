import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarksAndNumbers from '@/components/MarksAndNumbers';

const TestPage = () => {
  const [markValue, setMarkValue] = useState<string>('10X20 ft FCL');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MarksAndNumbers Component Test</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Component with String Output</CardTitle>
        </CardHeader>
        <CardContent>
          <MarksAndNumbers 
            initialContainerType="FCL"
            initialLeftValue="10"
            initialRightValue="20 ft"
            onChange={(value) => {
              setMarkValue(value);
            }}
          />
          <div className="mt-4 p-4 border rounded">
            <p className="font-medium">Current Value:</p>
            <code className="bg-gray-100 p-2 block mt-2">{markValue}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Component with Object Output (Legacy)</CardTitle>
        </CardHeader>
        <CardContent>
          <MarksAndNumbers 
            initialValues={{
              containerType: "FCL",
              leftValue: "10",
              rightValue: "20 ft"
            }}
            onChange={(values: any) => {
              // Handle object values change
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage; 