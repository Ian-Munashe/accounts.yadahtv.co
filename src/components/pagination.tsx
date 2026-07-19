import React from "react";
import { Pagination as HPagination } from "@heroui/react";

interface Props {
  totalPages: number;
  currentPage: number;
  onJump: (page: number) => void;
  onNext: (page: number) => void;
  onPrevious: (page: number) => void;
}

export const Pagination: React.FC<Props> = (props) => {
  if (props.totalPages <= 1) return null;
  return (
    <HPagination>
      <HPagination.Content>
        <HPagination.Item>
          <HPagination.Previous
            isDisabled={props.currentPage === 1}
            onPress={() => props.onPrevious(props.currentPage - 1)}
          >
            <HPagination.PreviousIcon />
            <span>Previous</span>
          </HPagination.Previous>
        </HPagination.Item>
        {Array.from({ length: props.totalPages }, (_, i) => i + 1).map((p) => (
          <HPagination.Item key={p}>
            <HPagination.Link isActive={p === props.currentPage} onPress={() => props.onJump(p)}>
              {p}
            </HPagination.Link>
          </HPagination.Item>
        ))}
        <HPagination.Item>
          <HPagination.Next
            isDisabled={props.currentPage === props.totalPages}
            onPress={() => props.onNext(props.currentPage + 1)}
          >
            <span>Next</span>
            <HPagination.NextIcon />
          </HPagination.Next>
        </HPagination.Item>
      </HPagination.Content>
    </HPagination>
  );
};
