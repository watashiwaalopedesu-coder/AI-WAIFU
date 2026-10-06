"use client";
import { Component, type ReactNode } from "react";
import { UserRound } from "lucide-react";
export class AvatarBoundary extends Component<
  { children: ReactNode; name: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="avatar-wrap">
        <div
          className="avatar-fallback"
          role="img"
          aria-label={`${this.props.name} avatar unavailable`}
        >
          <UserRound size={90} />
          <span>{this.props.name}</span>
          <button
            className="subtle-button"
            onClick={() => this.setState({ failed: false })}
          >
            Reload portrait
          </button>
        </div>
      </div>
    );
  }
}
