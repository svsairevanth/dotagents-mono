/**
 * ResponseHistoryPanel - Shows all respond_to_user tool call responses
 * from the current agent session, with per-message TTS playback.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { preprocessTextForTTS } from '@dotagents/shared';
import { useTheme } from './ThemeProvider';
import { MarkdownRenderer } from './MarkdownRenderer';
import { spacing, radius } from './theme';

export interface ResponseHistoryEntry {
  text: string;
  timestamp: number;
}

interface ResponseHistoryPanelProps {
  responses: ResponseHistoryEntry[];
  ttsRate?: number;
  ttsPitch?: number;
  ttsVoiceId?: string;
}

export function ResponseHistoryPanel({
  responses,
  ttsRate = 1.0,
  ttsPitch = 1.0,
  ttsVoiceId,
}: ResponseHistoryPanelProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  if (responses.length === 0) {
    return null;
  }

  const handleSpeak = (text: string, index: number) => {
    // If already speaking this message, stop it
    if (speakingIndex === index) {
      Speech.stop();
      setSpeakingIndex(null);
      return;
    }

    // Stop any current speech
    Speech.stop();

    const processedText = preprocessTextForTTS(text);
    if (!processedText) return;

    const speechOptions: Speech.SpeechOptions = {
      language: 'en-US',
      rate: ttsRate,
      pitch: ttsPitch,
      onDone: () => setSpeakingIndex(null),
      onStopped: () => setSpeakingIndex(null),
      onError: () => setSpeakingIndex(null),
    };
    if (ttsVoiceId) {
      speechOptions.voice = ttsVoiceId;
    }

    setSpeakingIndex(index);
    Speech.speak(processedText, speechOptions);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const styles = StyleSheet.create({
    container: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}30`,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: isCollapsed ? 0 : 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}50`,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primaryForeground,
    },
    list: {
      maxHeight: 300,
    },
    responseItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    responseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    timestamp: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
    },
    speakButton: {
      padding: 4,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isCollapsed ? 'Show agent responses' : 'Hide agent responses'}
        accessibilityState={{ expanded: !isCollapsed }}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.headerTitle}>Agent Responses</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{responses.length}</Text>
          </View>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={theme.colors.mutedForeground}
        />
      </TouchableOpacity>
      {!isCollapsed && (
        <ScrollView style={styles.list}>
          {/* Show newest first */}
          {[...responses].reverse().map((response, index) => {
            const originalIndex = responses.length - 1 - index;
            const isSpeaking = speakingIndex === originalIndex;
            return (
              <React.Fragment key={`${response.timestamp}-${index}`}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.responseItem}>
                  <View style={styles.responseHeader}>
                    <Text style={styles.timestamp}>
                      {formatTime(response.timestamp)}
                    </Text>
                    <TouchableOpacity
                      style={styles.speakButton}
                      onPress={() => handleSpeak(response.text, originalIndex)}
                      accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Speak this response'}
                    >
                      <Ionicons
                        name={isSpeaking ? 'stop-circle' : 'volume-medium'}
                        size={18}
                        color={isSpeaking ? theme.colors.primary : theme.colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                  <MarkdownRenderer content={response.text} />
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
