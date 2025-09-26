'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import {
  Select,
