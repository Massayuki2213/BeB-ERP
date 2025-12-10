// loja-backend/src/main/java/backend/loja_backend/config/CorsConfig.java
package backend.loja_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica a todas as rotas
                .allowedOrigins("http://localhost:5173") // Permite APENAS o seu front React
                .allowedMethods("GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS") // Métodos permitidos
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}

