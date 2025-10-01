package com.communityhub;

import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final String BASE_URL = "http://10.0.2.2:5002"; // Android 에뮬레이터에서 localhost 접근
    
    private RecyclerView recyclerView;
    private PostAdapter postAdapter;
    private List<Post> posts = new ArrayList<>();
    private OkHttpClient httpClient;
    private Gson gson;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        initializeComponents();
        setupRecyclerView();
        loadPosts();
    }

    private void initializeComponents() {
        httpClient = new OkHttpClient();
        gson = new Gson();
        recyclerView = findViewById(R.id.recyclerView);
    }

    private void setupRecyclerView() {
        postAdapter = new PostAdapter(posts);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(postAdapter);
    }

    private void loadPosts() {
        Log.d(TAG, "Loading posts from: " + BASE_URL + "/api/posts");
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/posts")
                .addHeader("Content-Type", "application/json")
                .addHeader("User-Agent", "CommunityHub-Android/1.0")
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to load posts", e);
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "네트워크 오류: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    Log.d(TAG, "Response received: " + responseBody);
                    
                    try {
                        Type listType = new TypeToken<List<Post>>(){}.getType();
                        List<Post> newPosts = gson.fromJson(responseBody, listType);
                        
                        runOnUiThread(() -> {
                            posts.clear();
                            posts.addAll(newPosts);
                            postAdapter.notifyDataSetChanged();
                            Toast.makeText(MainActivity.this, "게시물 " + newPosts.size() + "개 로드됨", Toast.LENGTH_SHORT).show();
                        });
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to parse posts", e);
                        runOnUiThread(() -> {
                            Toast.makeText(MainActivity.this, "데이터 파싱 오류", Toast.LENGTH_SHORT).show();
                        });
                    }
                } else {
                    Log.e(TAG, "Server error: " + response.code());
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "서버 오류: " + response.code(), Toast.LENGTH_SHORT).show();
                    });
                }
            }
        });
    }

    // Post 모델 클래스
    public static class Post {
        private int id;
        private String title;
        private String content;
        private String author;
        private String createdAt;
        private int views;
        private int likes;

        // Getters and Setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        
        public int getViews() { return views; }
        public void setViews(int views) { this.views = views; }
        
        public int getLikes() { return likes; }
        public void setLikes(int likes) { this.likes = likes; }
    }
}

