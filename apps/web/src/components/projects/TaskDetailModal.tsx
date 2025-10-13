'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { UPDATE_PROJECT_TASK } from '@/graphql/projects';
import { useMutation } from '@apollo/client';
import type { ProjectTask, TaskStatusType } from '@/shared/types/projects';
import {
    Download,
    Edit,
    Eye,
    MessageSquare,
    Paperclip,
    Plus,
    Save,
    Trash2,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: ProjectTask;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export function TaskDetailModal({ task, open, onClose, onUpdate }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'John Doe',
      content: 'Started working on this task. Will update progress by EOD.',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      author: 'Jane Smith',
      content: 'Please make sure to follow the coding standards document.',
      timestamp: '2024-01-15T14:20:00Z',
      attachments: ['coding-standards.pdf'],
    },
  ]);
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: '1',
      name: 'requirements.pdf',
      size: '2.4 MB',
      type: 'application/pdf',
      uploadedBy: 'John Doe',
      uploadedAt: '2024-01-15T09:00:00Z',
    },
    {
      id: '2',
      name: 'mockup.png',
      size: '1.8 MB',
      type: 'image/png',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-01-15T11:30:00Z',
    },
  ]);

  const [updateTask, { loading }] = useMutation(UPDATE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success('Task updated successfully');
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleSave = async () => {
    const updates = {
      taskName: editedTask.taskName,
      description: editedTask.description,
      status: editedTask.status,
      priority: editedTask.priority,
      assignedToId: editedTask.assignedToId,
      expectedStartDate: editedTask.expectedStartDate,
      expectedEndDate: editedTask.expectedEndDate,
      estimatedHours: editedTask.estimatedHours,
      percentComplete: editedTask.percentComplete,
    };

    await updateTask({
      variables: {
        id: task.id,
        input: updates,
      },
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
      };

      setAttachments([...attachments, attachment]);
    });

    toast.success('Files uploaded successfully');
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: 'bg-gray-100 text-gray-800',
      Working: 'bg-blue-100 text-blue-800',
      'Pending Review': 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-3">
                {isEditing ? (
                  <Input
                    value={editedTask.taskName}
                    onChange={(e) => setEditedTask({ ...editedTask, taskName: e.target.value })}
                    className="text-lg font-semibold"
                  />
                ) : (
                  task.taskName
                )}
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {task.taskCode} • Created {formatDate(task.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={loading} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTask(task);
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Files ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    {isEditing ? (
                      <Textarea
                        value={editedTask.description || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description || 'No description provided'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      {isEditing ? (
                        <Select
                          value={editedTask.priority}
                          onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      {isEditing ? (
                        <Select
                          value={editedTask.status}
                          onValueChange={(value) => setEditedTask({ ...editedTask, status: value as TaskStatusType })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Working">Working</SelectItem>
                            <SelectItem value="Pending Review">Pending Review</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Progress</label>
                    <div className="mt-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editedTask.percentComplete}
                            onChange={(e) => setEditedTask({
                              ...editedTask,
                              percentComplete: Number(e.target.value)
                            })}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Complete</span>
                            <span className="font-medium">{Math.round(task.percentComplete)}%</span>
                          </div>
                          <Progress value={task.percentComplete} className="h-2" />
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Assignment & Timing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assignee</label>
                    {isEditing ? (
                      <Select
                        value={editedTask.assignedToId || ''}
                        onValueChange={(value) => setEditedTask({ ...editedTask, assignedToId: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user-1">John Doe</SelectItem>
                          <SelectItem value="user-2">Jane Smith</SelectItem>
                          <SelectItem value="user-3">Bob Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        {task.assignedToId ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assignedToId.slice(-2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">User {task.assignedToId.slice(-4)}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Date</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedTask.expectedStartDate || ''}
                          onChange={(e) => setEditedTask({
                            ...editedTask,
                            expectedStartDate: e.target.value
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(task.expectedStartDate)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">End Date</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedTask.expectedEndDate || ''}
                          onChange={(e) => setEditedTask({
                            ...editedTask,
                            expectedEndDate: e.target.value
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(task.expectedEndDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimated Hours</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editedTask.estimatedHours || ''}
                          onChange={(e) => setEditedTask({
                            ...editedTask,
                            estimatedHours: Number(e.target.value)
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Actual Hours</label>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.actualHours}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Add Comment */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>CU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="comment-files"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('comment-files')?.click()}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach Files
                        </Button>
                      </div>
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                        {comment.attachments && (
                          <div className="flex flex-wrap gap-2">
                            {comment.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {/* Upload Files */}
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="task-files"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('task-files')?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Drag and drop files here or click to browse
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <Card key={attachment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.size} • Uploaded by {attachment.uploadedBy} • {formatDateTime(attachment.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">John Doe</span> updated the task status to <Badge className="mx-1">Working</Badge>
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Jane Smith</span> added a comment
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">System</span> created the task
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
