package com.communityhub;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class PostAdapter extends RecyclerView.Adapter<PostAdapter.PostViewHolder> {
    private List<MainActivity.Post> posts;

    public PostAdapter(List<MainActivity.Post> posts) {
        this.posts = posts;
    }

    @NonNull
    @Override
    public PostViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_post, parent, false);
        return new PostViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PostViewHolder holder, int position) {
        MainActivity.Post post = posts.get(position);
        holder.bind(post);
    }

    @Override
    public int getItemCount() {
        return posts.size();
    }

    static class PostViewHolder extends RecyclerView.ViewHolder {
        private TextView titleText;
        private TextView contentText;
        private TextView authorText;
        private TextView createdAtText;
        private TextView viewsText;
        private TextView likesText;

        public PostViewHolder(@NonNull View itemView) {
            super(itemView);
            titleText = itemView.findViewById(R.id.titleText);
            contentText = itemView.findViewById(R.id.contentText);
            authorText = itemView.findViewById(R.id.authorText);
            createdAtText = itemView.findViewById(R.id.createdAtText);
            viewsText = itemView.findViewById(R.id.viewsText);
            likesText = itemView.findViewById(R.id.likesText);
        }

        public void bind(MainActivity.Post post) {
            titleText.setText(post.getTitle() != null ? post.getTitle() : "제목 없음");
            contentText.setText(post.getContent() != null ? post.getContent() : "내용 없음");
            authorText.setText("작성자: " + (post.getAuthor() != null ? post.getAuthor() : "알 수 없음"));
            createdAtText.setText("작성일: " + (post.getCreatedAt() != null ? post.getCreatedAt() : "알 수 없음"));
            viewsText.setText("조회수: " + post.getViews());
            likesText.setText("좋아요: " + post.getLikes());
        }
    }
}

